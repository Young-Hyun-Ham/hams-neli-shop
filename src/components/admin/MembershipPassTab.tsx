import { useEffect, useState } from "react";
import { History, Loader2, Search, Trash2, WalletCards } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  Member,
  MembershipPass,
  MembershipPassCustomerType,
  MembershipPassTransaction,
  PriceItem,
} from "@/lib";
import { memberStorage } from "@/lib/memberStorage";
import { membershipPassStorage } from "@/lib/membershipPassStorage";

type Props = { prices: PriceItem[] };
const money = (value: number) => `${value.toLocaleString("ko-KR")}원`;
const priceNumber = (value: string) => Number(value.replace(/[^\d]/g, "")) || 0;
const emptyForm = {
  memberRefId: "",
  customerName: "",
  phone: "",
  memberId: "",
  passType: "service" as const,
  passName: "서비스 정기권",
  serviceId: "",
  serviceName: "",
  totalUses: 10,
  initialAmount: 100000,
  expiresAt: "",
  memo: "",
};

export function MembershipPassTab({ prices }: Props) {
  const [type, setType] = useState<MembershipPassCustomerType>("member");
  const [passes, setPasses] = useState<MembershipPass[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);
  const [usePass, setUsePass] = useState<MembershipPass | null>(null);
  const [historyPass, setHistoryPass] = useState<MembershipPass | null>(null);
  const [transactions, setTransactions] = useState<MembershipPassTransaction[]>(
    [],
  );
  const [priceId, setPriceId] = useState("");
  const [deduction, setDeduction] = useState(0);
  const [usageMemo, setUsageMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(
    () =>
      membershipPassStorage.subscribe(setPasses, () =>
        setError("정기권 목록을 불러오지 못했습니다."),
      ),
    [],
  );
  useEffect(() => {
    if (!memberOpen) return undefined;
    const timeout = window.setTimeout(async () => {
      setMemberLoading(true);
      try {
        setMembers(await memberStorage.search(memberSearch));
      } catch {
        setMembers([]);
        setError("통합 사이트에서 회원 목록을 불러오지 못했습니다.");
      } finally {
        setMemberLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [memberOpen, memberSearch]);
  useEffect(() => {
    if (!historyPass) return undefined;
    return membershipPassStorage.subscribeTransactions(
      historyPass.id,
      setTransactions,
    );
  }, [historyPass]);

  const filtered = passes.filter((pass) => pass.customerType === type);
  const foundMembers = members;
  const selectedPrice = prices.find((item) => item.id === priceId);

  const addPass = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !form.customerName.trim() ||
      !form.phone.trim() ||
      (form.passType === "amount" && form.initialAmount <= 0) ||
      (form.passType === "service" &&
        (!form.serviceId || form.totalUses <= 0)) ||
      (type === "member" && !form.memberRefId)
    ) {
      setError(
        type === "member"
          ? "회원을 조회해 선택하고 정기권 금액을 입력해 주세요."
          : "고객명, 연락처와 정기권 금액을 입력해 주세요.",
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      await membershipPassStorage.add({ ...form, customerType: type });
      setForm(emptyForm);
      setMessage("정기권을 추가했습니다.");
    } catch {
      setError("정기권을 추가하지 못했습니다. Firebase 권한을 확인해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  const applyUsage = async () => {
    const isServicePass = usePass?.passType === "service";
    if (
      !usePass ||
      !selectedPrice ||
      (!isServicePass && (deduction <= 0 || deduction > usePass.balance))
    ) {
      setError("서비스와 올바른 차감 금액을 확인해 주세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await membershipPassStorage.use(usePass.id, {
        priceItemId: selectedPrice.id,
        serviceName: selectedPrice.name,
        regularPrice: priceNumber(selectedPrice.price),
        deductedAmount: isServicePass ? 0 : deduction,
        memo: usageMemo,
      });
      setUsePass(null);
      setPriceId("");
      setDeduction(0);
      setUsageMemo("");
      setMessage("서비스 이용 금액을 차감했습니다.");
    } catch {
      setError(
        "금액을 차감하지 못했습니다. 잔액과 Firebase 권한을 확인해 주세요.",
      );
    } finally {
      setSaving(false);
    }
  };

  const openUsage = (pass: MembershipPass) => {
    const fixedPrice = prices.find((item) => item.id === pass.serviceId);
    setUsePass(pass);
    setPriceId(fixedPrice?.id || "");
    setDeduction(
      pass.passType === "amount" && fixedPrice
        ? priceNumber(fixedPrice.price)
        : 0,
    );
  };

  return (
    <>
      <Tabs
        value={type}
        onValueChange={(value) => {
          setType(value as MembershipPassCustomerType);
          setForm(emptyForm);
        }}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="member">회원 정기권 관리</TabsTrigger>
          <TabsTrigger value="nonMember">비회원 정기권 관리</TabsTrigger>
        </TabsList>
        {(["member", "nonMember"] as const).map((currentType) => (
          <TabsContent
            key={currentType}
            value={currentType}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentType === "member" ? "회원" : "비회원"} 금액 정기권
                  추가
                </CardTitle>
                <CardDescription>
                  충전 금액에서 이용 서비스별 실제 금액을 차감합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={addPass}
                  className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                >
                  {currentType === "member" ? (
                    <div className="space-y-2 md:col-span-2 xl:col-span-3">
                      <Label>회원 조회</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={
                            form.memberRefId
                              ? `${form.customerName} · ${form.phone} · ${form.memberId}`
                              : "선택된 회원이 없습니다."
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setMemberOpen(true)}
                        >
                          <Search className="mr-2 h-4 w-4" />
                          회원 검색
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Field
                        label="고객명"
                        value={form.customerName}
                        onChange={(value) =>
                          setForm({ ...form, customerName: value })
                        }
                      />
                      <Field
                        label="연락처"
                        value={form.phone}
                        onChange={(value) => setForm({ ...form, phone: value })}
                      />
                    </>
                  )}
                  <div className="space-y-2">
                    <Label>정기권 타입</Label>
                    <select
                      value={form.passType}
                      onChange={(event) => {
                        const passType = event.target.value as
                          | "service"
                          | "amount";
                        setForm({
                          ...form,
                          passType,
                          passName:
                            passType === "service"
                              ? "서비스 정기권"
                              : "금액 정기권",
                        });
                      }}
                      className="h-10 w-full rounded-md border bg-background px-3"
                    >
                      <option value="service">서비스 횟수형</option>
                      <option value="amount">금액 충전형</option>
                    </select>
                  </div>
                  <Field
                    label="정기권 이름"
                    value={form.passName}
                    onChange={(value) => setForm({ ...form, passName: value })}
                  />
                  {form.passType === "service" ? (
                    <>
                      <div className="space-y-2">
                        <Label>서비스</Label>
                        <select
                          value={form.serviceId}
                          onChange={(event) => {
                            const item = prices.find(
                              (price) => price.id === event.target.value,
                            );
                            setForm({
                              ...form,
                              serviceId: item?.id || "",
                              serviceName: item?.name || "",
                              passName: item
                                ? `${item.name} 정기권`
                                : form.passName,
                            });
                          }}
                          className="h-10 w-full rounded-md border bg-background px-3"
                        >
                          <option value="">서비스를 선택하세요</option>
                          {prices.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.category} · {item.name} ({item.price})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>총 이용 횟수</Label>
                        <Input
                          type="number"
                          min={1}
                          value={form.totalUses}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              totalUses: Number(event.target.value),
                            })
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label>최초 충전 금액</Label>
                      <Input
                        type="number"
                        min={1}
                        value={form.initialAmount}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            initialAmount: Number(event.target.value),
                          })
                        }
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>유효기간</Label>
                    <Input
                      type="date"
                      value={form.expiresAt}
                      onChange={(event) =>
                        setForm({ ...form, expiresAt: event.target.value })
                      }
                    />
                  </div>
                  <Field
                    label="메모"
                    value={form.memo}
                    onChange={(value) => setForm({ ...form, memo: value })}
                  />
                  <div className="flex items-end">
                    <Button disabled={saving} type="submit">
                      정기권 추가
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            <Card>
              <CardHeader>
                <CardTitle>정기권 목록</CardTitle>
                <CardDescription>
                  잔액과 서비스 이용 내역을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>고객</TableHead>
                        <TableHead>정기권</TableHead>
                        <TableHead>금액</TableHead>
                        <TableHead>유효기간</TableHead>
                        <TableHead>관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((pass) => (
                        <TableRow key={pass.id}>
                          <TableCell>
                            <b>{pass.customerName}</b>
                            <div className="text-xs text-muted-foreground">
                              {pass.phone}
                              {pass.memberId ? ` · ${pass.memberId}` : ""}
                            </div>
                          </TableCell>
                          <TableCell>{pass.passName}</TableCell>
                          <TableCell>
                            <b className="text-primary">
                              {pass.passType === "service"
                                ? `잔여 ${pass.remainingUses || 0}회`
                                : `잔액 ${money(pass.balance)}`}
                            </b>
                            <div className="text-xs text-muted-foreground">
                              {pass.passType === "service"
                                ? `${pass.serviceName} · 총 ${pass.totalUses || 0}회`
                                : `최초 ${money(pass.initialAmount)}`}
                            </div>
                          </TableCell>
                          <TableCell>{pass.expiresAt || "없음"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                disabled={
                                  pass.passType === "service"
                                    ? (pass.remainingUses || 0) <= 0
                                    : pass.balance <= 0
                                }
                                onClick={() => openUsage(pass)}
                              >
                                <WalletCards className="mr-1 h-4 w-4" />
                                서비스 이용
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => setHistoryPass(pass)}
                                title="이용 내역"
                              >
                                <History className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={() =>
                                  window.confirm(
                                    "정기권을 삭제하시겠습니까?",
                                  ) &&
                                  void membershipPassStorage.remove(pass.id)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-10 text-center text-muted-foreground"
                          >
                            등록된 정기권이 없습니다.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>회원 검색</DialogTitle>
            <DialogDescription>
              회원명, 연락처 또는 회원 번호로 검색합니다.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="회원 검색"
            value={memberSearch}
            onChange={(event) => setMemberSearch(event.target.value)}
          />
          <div className="max-h-80 overflow-y-auto rounded-lg border">
            {memberLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : null}
            {foundMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                className="flex w-full justify-between border-b p-3 text-left hover:bg-muted"
                onClick={() => {
                  setForm({
                    ...form,
                    memberRefId: member.id,
                    customerName: member.name,
                    phone: member.phone,
                    memberId: member.memberNumber,
                  });
                  setMemberOpen(false);
                }}
              >
                <span>
                  <b>{member.name}</b>
                  <small className="block text-muted-foreground">
                    {member.phone}
                  </small>
                </span>
                <span className="text-sm">{member.memberNumber}</span>
              </button>
            ))}
            {!memberLoading && foundMembers.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                조회된 회원이 없습니다.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!usePass}
        onOpenChange={(open) => !open && setUsePass(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>서비스 이용 금액 차감</DialogTitle>
            <DialogDescription>
              {usePass?.customerName} ·{" "}
              {usePass?.passType === "service"
                ? `잔여 ${usePass.remainingUses || 0}회`
                : `현재 잔액 ${money(usePass?.balance || 0)}`}
            </DialogDescription>
          </DialogHeader>
          <Label>서비스</Label>
          <select
            value={priceId}
            onChange={(event) => {
              const item = prices.find(
                (price) => price.id === event.target.value,
              );
              setPriceId(event.target.value);
              setDeduction(item ? priceNumber(item.price) : 0);
            }}
            className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3"
          >
            <option value="">선택하세요</option>
            {prices
              .filter(
                (item) =>
                  usePass?.passType !== "service" ||
                  item.id === usePass.serviceId,
              )
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.category} · {item.name} ({item.price})
                </option>
              ))}
          </select>
          {usePass?.passType === "amount" ? (
            <>
              <Label>실제 차감 금액</Label>
              <Input
                type="number"
                min={1}
                value={deduction}
                className="min-w-0 max-w-full"
                onChange={(event) => setDeduction(Number(event.target.value))}
              />
              <p className="text-sm text-muted-foreground">
                차감 후 예상 잔액:{" "}
                {money(Math.max(0, (usePass?.balance || 0) - deduction))}
              </p>
            </>
          ) : (
            <p className="rounded-lg bg-muted p-3 text-sm">
              이용 적용 시 <b>1회</b>가 차감되며 잔여{" "}
              {Math.max(0, (usePass?.remainingUses || 0) - 1)}회가 됩니다.
            </p>
          )}
          <Field label="메모" value={usageMemo} onChange={setUsageMemo} />
          <Button disabled={saving} onClick={() => void applyUsage()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}차감
            적용
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!historyPass}
        onOpenChange={(open) => !open && setHistoryPass(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>정기권 이용 내역</DialogTitle>
            <DialogDescription>
              {historyPass?.customerName} · {historyPass?.passName}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>일시</TableHead>
                  <TableHead>서비스</TableHead>
                  <TableHead>차감</TableHead>
                  <TableHead>이용 후</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((item) => (
                  <TableRow
                    key={item.id}
                    className={item.status === "canceled" ? "opacity-50" : ""}
                  >
                    <TableCell>
                      {new Date(item.usedAt).toLocaleString("ko-KR")}
                    </TableCell>
                    <TableCell>{item.serviceName}</TableCell>
                    <TableCell>
                      {item.useCount
                        ? `${item.useCount}회`
                        : money(item.deductedAmount)}
                    </TableCell>
                    <TableCell>
                      {item.useCount
                        ? `잔여 ${item.remainingUsesAfter || 0}회`
                        : money(item.balanceAfter)}
                    </TableCell>
                    <TableCell>
                      {item.status === "canceled" ? (
                        "취소됨"
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            historyPass &&
                            void membershipPassStorage.cancelTransaction(
                              historyPass.id,
                              item.id,
                            )
                          }
                        >
                          차감 취소
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <Label>{label}</Label>
      <Input
        value={value}
        className="min-w-0 max-w-full"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

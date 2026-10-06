import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import type { MembershipPass, MembershipPassTransaction } from "./index";

const COLLECTION = "membershipPasses";
type CreateInput = Omit<
  MembershipPass,
  "id" | "createdAt" | "updatedAt" | "balance" | "status"
>;
type UseInput = Pick<
  MembershipPassTransaction,
  "priceItemId" | "serviceName" | "regularPrice" | "deductedAmount" | "memo"
>;
const assertConfigured = () => {
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured.");
};
const normalize = (
  id: string,
  data: Omit<MembershipPass, "id">,
): MembershipPass => ({
  ...data,
  id,
  memberRefId: data.memberRefId || "",
  memberId: data.memberId || "",
  passType: data.passType || "amount",
  passName: data.passName || "금액 정기권",
  serviceId: data.serviceId || "",
  serviceName: data.serviceName || "",
  totalUses: Number(data.totalUses) || 0,
  remainingUses: Number(data.remainingUses) || 0,
  initialAmount: Number(data.initialAmount) || 0,
  balance: Number(data.balance) || 0,
  status: data.status || "active",
});

export const membershipPassStorage = {
  subscribe(
    onData: (items: MembershipPass[]) => void,
    onError?: (error: Error) => void,
  ) {
    assertConfigured();
    return onSnapshot(
      query(collection(db, COLLECTION), orderBy("createdAt", "desc")),
      (snapshot) =>
        onData(
          snapshot.docs.map((item) =>
            normalize(item.id, item.data() as Omit<MembershipPass, "id">),
          ),
        ),
      (error) => onError?.(error),
    );
  },
  async add(input: CreateInput) {
    assertConfigured();
    const now = new Date().toISOString();
    const initialAmount =
      input.passType === "amount"
        ? Math.max(0, Number(input.initialAmount) || 0)
        : 0;
    const totalUses =
      input.passType === "service"
        ? Math.max(0, Number(input.totalUses) || 0)
        : 0;
    await addDoc(collection(db, COLLECTION), {
      ...input,
      initialAmount,
      balance: initialAmount,
      totalUses,
      remainingUses: totalUses,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
  async use(passId: string, input: UseInput) {
    assertConfigured();
    const passRef = doc(db, COLLECTION, passId);
    const usageRef = doc(collection(passRef, "transactions"));
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(passRef);
      if (!snapshot.exists()) throw new Error("PASS_NOT_FOUND");
      const pass = normalize(
        snapshot.id,
        snapshot.data() as Omit<MembershipPass, "id">,
      );
      const amount = Math.max(0, Number(input.deductedAmount) || 0);
      const now = new Date().toISOString();
      const isServicePass = pass.passType === "service";
      if (isServicePass && input.priceItemId !== pass.serviceId)
        throw new Error("INVALID_SERVICE");
      if (isServicePass && (pass.remainingUses || 0) <= 0)
        throw new Error("NO_REMAINING_USES");
      if (!isServicePass && (amount <= 0 || amount > pass.balance))
        throw new Error("INVALID_AMOUNT");
      const balanceAfter = isServicePass ? pass.balance : pass.balance - amount;
      const remainingUsesAfter = isServicePass
        ? (pass.remainingUses || 0) - 1
        : pass.remainingUses || 0;
      transaction.update(passRef, {
        balance: balanceAfter,
        remainingUses: remainingUsesAfter,
        status:
          (isServicePass && remainingUsesAfter === 0) ||
          (!isServicePass && balanceAfter === 0)
            ? "usedUp"
            : "active",
        updatedAt: now,
      });
      transaction.set(usageRef, {
        ...input,
        passId,
        deductedAmount: amount,
        useCount: isServicePass ? 1 : 0,
        remainingUsesBefore: pass.remainingUses || 0,
        remainingUsesAfter,
        balanceBefore: pass.balance,
        balanceAfter,
        status: "completed",
        usedAt: now,
      });
    });
  },
  subscribeTransactions(
    passId: string,
    onData: (items: MembershipPassTransaction[]) => void,
  ) {
    assertConfigured();
    return onSnapshot(
      query(
        collection(db, COLLECTION, passId, "transactions"),
        orderBy("usedAt", "desc"),
      ),
      (snapshot) =>
        onData(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<MembershipPassTransaction, "id">),
          })),
        ),
    );
  },
  async cancelTransaction(passId: string, transactionId: string) {
    assertConfigured();
    const passRef = doc(db, COLLECTION, passId);
    const usageRef = doc(db, COLLECTION, passId, "transactions", transactionId);
    await runTransaction(db, async (transaction) => {
      const passSnapshot = await transaction.get(passRef);
      const usageSnapshot = await transaction.get(usageRef);
      if (!passSnapshot.exists() || !usageSnapshot.exists())
        throw new Error("NOT_FOUND");
      const usage = usageSnapshot.data() as MembershipPassTransaction;
      if (usage.status === "canceled") return;
      const pass = normalize(
        passSnapshot.id,
        passSnapshot.data() as Omit<MembershipPass, "id">,
      );
      const now = new Date().toISOString();
      const isServicePass = pass.passType === "service";
      transaction.update(passRef, {
        balance: isServicePass
          ? pass.balance
          : pass.balance + usage.deductedAmount,
        remainingUses: isServicePass
          ? (pass.remainingUses || 0) + (usage.useCount || 1)
          : pass.remainingUses || 0,
        status: "active",
        updatedAt: now,
      });
      transaction.update(usageRef, { status: "canceled", canceledAt: now });
    });
  },
  async remove(id: string) {
    assertConfigured();
    await deleteDoc(doc(db, COLLECTION, id));
  },
};

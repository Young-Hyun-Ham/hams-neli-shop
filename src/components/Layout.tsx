import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogIn, LogOut, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { SiFacebook, SiInstagram, SiKakao, SiTiktok, SiX } from 'react-icons/si';

import { DEFAULT_SITE_SETTINGS, ROUTE_PATHS, type SiteSettings } from '@/lib/index';
import { settingsStorage } from '@/lib/settingsStorage';
import { beginSSOLogin, logoutService, ServiceViewer } from '@/lib/sso';
import { useAuthStore } from '@/lib/auth-store';

interface LayoutProps {
  children: React.ReactNode;
}

const PENDING_SCROLL_KEY = 'pending-home-scroll-target';
const REVIEW_IMAGE_DRAFT_KEY = 'pending-testimonial-images';
const REVIEW_EDIT_DRAFT_KEY = 'testimonial-edit-draft';
const HOME_SECTION_IDS = ['services', 'pricing', 'contact'] as const;

type NavItem = {
  to: string;
  label: string;
  homeOnly?: boolean;
  isAnchor?: boolean;
  sectionId?: (typeof HOME_SECTION_IDS)[number];
};

export const HOME_LOGO_TITLE = 'YUMMYNAIL SHOP';

const hasVisibleSocialLink = (value: string) => value.trim().length > 0;
const adminEmailSet = new Set(
  (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const viewer: ServiceViewer | null = useAuthStore((state) => state.viewer);
  const authLoading = useAuthStore((state) => state.authLoading);
  const logoutPending = useAuthStore((state) => state.logoutPending);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setLogoutPending = useAuthStore((state) => state.setLogoutPending);
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminViewer = viewer ? adminEmailSet.has(viewer.emailLower) : false;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let unsubscribe = () => {};

    try {
      unsubscribe = settingsStorage.subscribeSettings(
        (settings) => {
          setSiteSettings(settings);
        },
        (error) => {
          console.error('Failed to subscribe footer settings:', error);
          setSiteSettings(DEFAULT_SITE_SETTINGS);
        },
      );
    } catch (error) {
      console.error('Failed to initialize footer settings subscription:', error);
      setSiteSettings(DEFAULT_SITE_SETTINGS);
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    if (location.pathname !== ROUTE_PATHS.HOME) {
      setActiveSection('');
      return;
    }

    const sections = HOME_SECTION_IDS
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries.length > 0) {
          setActiveSection(visibleEntries[0].target.id);
          return;
        }

        const firstSectionTop =
          sections[0]?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;

        if (firstSectionTop > 160) {
          setActiveSection('');
        }
      },
      {
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0.2, 0.35, 0.5, 0.7],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [children, location.pathname]);

  const navItems = useMemo<NavItem[]>(
    () => [
      { to: ROUTE_PATHS.HOME, label: '홈', homeOnly: true },
      { to: ROUTE_PATHS.EVENTS, label: '이벤트' },
      { to: '/#services', label: '서비스', isAnchor: true, sectionId: 'services' },
      { to: '/#pricing', label: '가격표', isAnchor: true, sectionId: 'pricing' },
      { to: ROUTE_PATHS.TESTIMONIALS, label: '고객후기' },
      { to: ROUTE_PATHS.REVIEW, label: '후기작성' },
      { to: ROUTE_PATHS.GALLERY, label: '갤러리' },
      { to: ROUTE_PATHS.ADMIN, label: '관리자' },
    ],
    [],
  );

  const visibleNavItems = useMemo(
    () =>
      navItems.filter((item) => {
        if (item.to !== ROUTE_PATHS.ADMIN) {
          return true;
        }

        return isAdminViewer;
      }),
    [isAdminViewer, navItems],
  );

  const socialLinks = useMemo(
    () =>
      [
        { href: siteSettings.facebookUrl, label: '페이스북', icon: SiFacebook },
        { href: siteSettings.instagramUrl, label: '인스타그램', icon: SiInstagram },
        { href: siteSettings.tiktokUrl, label: '틱톡', icon: SiTiktok },
        { href: siteSettings.xUrl, label: 'X', icon: SiX },
        { href: siteSettings.kakaoOpenChatUrl, label: '카카오톡 오픈방', icon: SiKakao },
      ].filter(({ href }) => hasVisibleSocialLink(href)),
    [siteSettings],
  );

  const handleAnchorClick = (to: string) => {
    const hash = to.split('#')[1];

    if (!hash) {
      return;
    }

    setActiveSection(hash);

    if (location.pathname === ROUTE_PATHS.HOME) {
      document.getElementById(hash)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      return;
    }

    sessionStorage.setItem(PENDING_SCROLL_KEY, hash);
    navigate(ROUTE_PATHS.HOME);
  };

  const handleReviewClick = () => {
    localStorage.removeItem(REVIEW_IMAGE_DRAFT_KEY);
    sessionStorage.removeItem(REVIEW_EDIT_DRAFT_KEY);
  };

  const handleHomeClick = () => {
    setActiveSection('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginClick = () => {
    try {
      beginSSOLogin();
    } catch (error) {
      console.error('Failed to start SSO login:', error);
    }
  };

  const handleLogoutClick = async () => {
    try {
      setLogoutPending(true);
      clearSession();
      await logoutService();
    } catch (error) {
      console.error('Failed to logout from service:', error);
    } finally {
      setLogoutPending(false);
      setMobileMenuOpen(false);
    }
  };

  const getNavClassName = (active: boolean) =>
    `cursor-pointer font-medium transition-colors duration-200 ${
      active ? 'text-primary' : 'text-foreground/80 hover:text-primary'
    }`;

  const isAnchorActive = (sectionId?: string) =>
    location.pathname === ROUTE_PATHS.HOME && activeSection === sectionId;

  const isRouteActive = (to: string, homeOnly?: boolean) => {
    if (homeOnly) {
      return location.pathname === ROUTE_PATHS.HOME && !activeSection;
    }

    return location.pathname === to;
  };

  const authActionLabel = authLoading ? '확인 중...' : viewer ? '로그아웃' : '로그인';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link
              to={ROUTE_PATHS.HOME}
              className="flex items-center space-x-2"
              onClick={(event) => {
                if (location.pathname === ROUTE_PATHS.HOME) {
                  event.preventDefault();
                  handleHomeClick();
                }
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
                <span className="text-lg font-bold text-white">N</span>
              </div>
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-xl font-semibold text-transparent">
                {HOME_LOGO_TITLE}
              </span>
            </Link>

            <nav className="hidden items-center space-x-8 md:flex">
              {visibleNavItems.map((item) =>
                item.isAnchor ? (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => handleAnchorClick(item.to)}
                    className={getNavClassName(isAnchorActive(item.sectionId))}
                  >
                    {item.label}
                  </button>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={(event) => {
                      if (item.homeOnly && location.pathname === ROUTE_PATHS.HOME) {
                        event.preventDefault();
                        handleHomeClick();
                        return;
                      }

                      if (item.to === ROUTE_PATHS.REVIEW) {
                        handleReviewClick();
                      }
                    }}
                    className={() => getNavClassName(isRouteActive(item.to, item.homeOnly))}
                  >
                    {item.label}
                  </NavLink>
                ),
              )}
            </nav>

            <div className="flex items-center gap-2">
              {/* 통합로그인 처리*/}
              <button
                type="button"
                onClick={viewer ? handleLogoutClick : handleLoginClick}
                disabled={authLoading || logoutPending}
                className="hidden items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 md:inline-flex"
              >
                {viewer ? <LogOut size={16} /> : <LogIn size={16} />}
                <span>{logoutPending ? '로그아웃 중...' : authActionLabel}</span>
              </button>
              
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-muted md:hidden"
                aria-label="메뉴 열기"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-border bg-background md:hidden"
            >
              <nav className="container mx-auto flex flex-col space-y-4 px-4 py-4">
                {visibleNavItems.map((item) =>
                  item.isAnchor ? (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => {
                        handleAnchorClick(item.to);
                        setMobileMenuOpen(false);
                      }}
                      className={`cursor-pointer py-2 text-left ${getNavClassName(
                        isAnchorActive(item.sectionId),
                      )}`}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={(event) => {
                        if (item.homeOnly && location.pathname === ROUTE_PATHS.HOME) {
                          event.preventDefault();
                          handleHomeClick();
                          setMobileMenuOpen(false);
                          return;
                        }

                        if (item.to === ROUTE_PATHS.REVIEW) {
                          handleReviewClick();
                        }
                      }}
                      className={() =>
                        `cursor-pointer py-2 ${getNavClassName(
                          isRouteActive(item.to, item.homeOnly),
                        )}`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ),
                )}

                {/* 통합로그인 처리*/}
                <button
                  type="button"
                  onClick={viewer ? handleLogoutClick : handleLoginClick}
                  disabled={authLoading || logoutPending}
                  className="flex cursor-pointer items-center gap-2 py-2 text-left font-medium text-foreground/80 transition-colors duration-200 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {viewer ? <LogOut size={18} /> : <LogIn size={18} />}
                  <span>{logoutPending ? '로그아웃 중...' : authActionLabel}</span>
                </button>
                
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 pt-16">{children}</main>

      <footer className="border-t border-border bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div className="mb-4 flex items-center space-x-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
                  <span className="text-lg font-bold text-white">N</span>
                </div>
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-xl font-semibold text-transparent">
                  {HOME_LOGO_TITLE}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                손끝과 분위기까지 완성하는 프리미엄 네일 서비스를 제공합니다.
              </p>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-foreground">연락처</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-muted-foreground">
                  <Phone size={18} className="text-primary" />
                  <span className="text-sm">{siteSettings.phone}</span>
                </div>
                <div className="flex items-center space-x-3 text-muted-foreground">
                  <Mail size={18} className="text-primary" />
                  <span className="text-sm">{siteSettings.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-muted-foreground">
                  <MapPin size={18} className="text-primary" />
                  <span className="text-sm">{siteSettings.addressLine1}</span>
                </div>
              </div>
            </div>

            {socialLinks.length > 0 && (
              <div>
                <h3 className="mb-4 font-semibold text-foreground">소셜 미디어</h3>
                <div className="flex flex-wrap gap-4">
                  {socialLinks.map(({ href, label, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-all duration-200 hover:bg-primary hover:text-white"
                      aria-label={label}
                    >
                      <Icon size={20} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-border pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2026 {HOME_LOGO_TITLE}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

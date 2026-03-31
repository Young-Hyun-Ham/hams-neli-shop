import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { SiFacebook, SiInstagram, SiKakao, SiTiktok, SiX } from 'react-icons/si';
import { DEFAULT_SITE_SETTINGS, ROUTE_PATHS, type SiteSettings } from '@/lib/index';
import { settingsStorage } from '@/lib/settingsStorage';

interface LayoutProps {
  children: React.ReactNode;
}

const PENDING_SCROLL_KEY = 'pending-home-scroll-target';
const REVIEW_IMAGE_DRAFT_KEY = 'pending-testimonial-images';
const REVIEW_EDIT_DRAFT_KEY = 'testimonial-edit-draft';
const HOME_SECTION_IDS = ['services', 'pricing', 'contact'] as const;
const hasVisibleSocialLink = (value: string) => value.trim().length > 0;

type NavItem = {
  to: string;
  label: string;
  homeOnly?: boolean;
  isAnchor?: boolean;
  sectionId?: (typeof HOME_SECTION_IDS)[number];
};

export function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const location = useLocation();
  const navigate = useNavigate();

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

        const firstSectionTop = sections[0]?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
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
      { to: '/#services', label: '서비스', isAnchor: true, sectionId: 'services' },
      { to: '/#pricing', label: '가격표', isAnchor: true, sectionId: 'pricing' },
      { to: ROUTE_PATHS.TESTIMONIALS, label: '고객후기' },
      { to: ROUTE_PATHS.REVIEW, label: '후기작성' },
      { to: ROUTE_PATHS.GALLERY, label: '갤러리' },
      { to: ROUTE_PATHS.ADMIN, label: '관리자' },
    ],
    [],
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
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    sessionStorage.setItem(PENDING_SCROLL_KEY, hash);
    navigate(ROUTE_PATHS.HOME);
  };

  const handleReviewClick = () => {
    localStorage.removeItem(REVIEW_IMAGE_DRAFT_KEY);
    sessionStorage.removeItem(REVIEW_EDIT_DRAFT_KEY);
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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to={ROUTE_PATHS.HOME} className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
                <span className="text-lg font-bold text-white">N</span>
              </div>
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-xl font-semibold text-transparent">
                네일아트 스튜디오
              </span>
            </Link>

            <nav className="hidden items-center space-x-8 md:flex">
              {navItems.map((item) =>
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
                    onClick={() => {
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
                {navItems.map((item) =>
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
                      onClick={() => {
                        if (item.to === ROUTE_PATHS.REVIEW) {
                          handleReviewClick();
                        }
                      }}
                      className={() =>
                        `cursor-pointer py-2 ${getNavClassName(isRouteActive(item.to, item.homeOnly))}`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ),
                )}
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
                  네일아트 스튜디오
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
              © 2026 네일아트 스튜디오. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

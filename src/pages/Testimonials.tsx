import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { TestimonialCard } from '@/components/Cards';
import { Layout } from '@/components/Layout';
import { TestimonialDetailDialog } from '@/components/TestimonialDetailDialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { testimonials as fallbackTestimonials } from '@/data/index';
import type { Testimonial } from '@/lib/index';
import { testimonialStorage } from '@/lib/testimonialStorage';

const PAGE_SIZE = 12;

export default function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>(fallbackTestimonials);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [currentPage, items]);

  useEffect(() => {
    setLoading(true);

    let unsubscribe = () => {};

    try {
      unsubscribe = testimonialStorage.subscribeTestimonials(
        (data) => {
          setItems(data.length > 0 ? data : fallbackTestimonials);
          setLoading(false);
        },
        (error) => {
          console.error('Failed to subscribe testimonials:', error);
          setItems(fallbackTestimonials);
          setLoading(false);
        },
      );
    } catch (error) {
      console.error('Failed to initialize testimonial subscription:', error);
      setItems(fallbackTestimonials);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-secondary/10 via-background to-primary/10 px-4 py-6 ">
        <div className="mx-auto max-w-6xl space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-foreground md:text-5xl">고객후기</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              등록된 고객후기 확인할 수 있습니다.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {pagedItems.map((testimonial) => (
                  <TestimonialCard
                    key={testimonial.id}
                    testimonial={testimonial}
                    onClick={setSelectedTestimonial}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setCurrentPage((prev) => Math.max(1, prev - 1));
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }).map((_, index) => {
                      const page = index + 1;

                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            isActive={page === currentPage}
                            onClick={(event) => {
                              event.preventDefault();
                              setCurrentPage(page);
                            }}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                        }}
                        className={
                          currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </div>

      <TestimonialDetailDialog
        testimonial={selectedTestimonial}
        open={!!selectedTestimonial}
        onOpenChange={(open) => !open && setSelectedTestimonial(null)}
      />
    </Layout>
  );
}

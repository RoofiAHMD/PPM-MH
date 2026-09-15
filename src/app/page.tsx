import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/home/Hero';
import { AboutSection, ProgramSection, FacilitiesSection, ContactSection, GallerySection } from '@/components/home/InfoSections';
import BeritaCarousel from '@/components/home/BeritaCarousel';
import { Footer } from '@/components/layout/Footer';


export default function Home() {
  return (
    <main className="min-h-screen gradient-dark">
      <Navbar />
      <Hero />
      <AboutSection />
      <ProgramSection />
      <FacilitiesSection />
      <GallerySection />
      <BeritaCarousel />
      <ContactSection />
      <Footer />
    </main>
  );
}

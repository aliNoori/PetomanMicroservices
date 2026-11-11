import {
  HeroSection,
  FeatureGrid,
  ProductSection,
  PostSection,
  PhilosophySection,
} from "@/features/home";


export default function Home() {

  return (

    <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-10 sm:px-6 lg:px-8">

      <HeroSection />

      <FeatureGrid />

      <ProductSection />

      <PostSection />

      <PhilosophySection />

    </main>

  );

}
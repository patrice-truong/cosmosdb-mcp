import { Button } from "@/components/ui/button";
import Image from "next/image";
import Products from "@/components/Products";

type Props = {
  searchParams: Promise<{
    ids?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  // Wait for searchParams to resolve
  const params = await searchParams;
  const productIds = params?.ids?.split(",").filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative">
        <div className="absolute inset-0">
          <Image src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" alt="Winter mountain landscape" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gray-900/40" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">Ready for a new adventure?</h1>
          <p className="mt-6 text-xl text-white max-w-3xl">Start the season with the latest in clothing and equipment.</p>
          <div className="mt-10">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
              Shop Now
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Products productIds={productIds} />
      </div>
    </div>
  );
}

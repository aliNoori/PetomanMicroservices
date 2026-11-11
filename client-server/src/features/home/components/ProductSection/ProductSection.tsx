import {
  Button,
} from "../../../../components/common/Button";


import {
  ProductCard,
} from "../../../products/components/ProductCard";



const products = [
  {
    id: "product-1",
    name: "Premium Adult Dog Food",
    slug: "premium-adult-dog-food",
    image:
      "https://image.made-in-china.com/365f3j00dmpPwYWhkVGA/Gt-Wholesale-Mylar-Gold-Aluminum-Foil-Stand-up-Packaging-Bag-at-Wholesale-Price-Paper-Sack-Bag-Pinch-Bottom-for-Pet-Food.webp",
    category: "Dog Food",
    brand: "PetCare",
    price: {
      amount: 29.9,
      currency: "EUR",
      formatted: "€29.90",
      originalAmount: 34.9,
      originalFormatted: "€34.90",
      discountPercentage: 14,
    },
    rating: {
      value: 4.8,
      count: 124,
    },
    stockStatus: "in-stock" as const,
    badge: "Best Seller",
  },
  {
    id: "product-2",
    name: "Interactive Pet Toy",
    slug: "interactive-pet-toy",
    image:
      "https://assets.kogan.com/images/emutreegroup/ETG-PT7496BL-ETGSYZ-Ara00029255555/1-70596a2c7d-752aa8323313475080e9bca13b14e131.png",
    category: "Pet Toys",
    brand: "PetPlay",
    price: {
      amount: 19.9,
      currency: "EUR",
      formatted: "€19.90",
    },
    rating: {
      value: 4.6,
      count: 87,
    },
    stockStatus: "low-stock" as const,
    badge: "Popular",
  },
  {
    id: "product-3",
    name: "Premium Pet Bed",
    slug: "premium-pet-bed",
    image:
      "https://image.made-in-china.com/365f3j00dmpPwYWhkVGA/Gt-Wholesale-Mylar-Gold-Aluminum-Foil-Stand-up-Packaging-Bag-at-Wholesale-Price-Paper-Sack-Bag-Pinch-Bottom-for-Pet-Food.webp",
    category: "Pet Accessories",
    brand: "ComfortPet",
    price: {
      amount: 49.9,
      currency: "EUR",
      formatted: "€49.90",
    },
    rating: {
      value: 4.9,
      count: 213,
    },
    stockStatus: "in-stock" as const,
    badge: "Top Rated",
  },
];



export function ProductSection() {


  return (

    <section
      aria-labelledby="featured-products-title"
      className="space-y-6"
    >

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Marketplace
          </p>


          <h2
            id="featured-products-title"
            className="mt-2 text-3xl font-bold tracking-tight text-text-primary"
          >
            Featured Products
          </h2>


          <p className="mt-2 max-w-2xl text-text-secondary">

            A complete product-card scenario with pricing,
            discount, rating, stock state, favorite interaction,
            quantity control, and cart action.

          </p>

        </div>


        <Button variant="outline">
          View All Products
        </Button>


      </div>



      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

        {
          products.map(
            (
              product,
              index,
            ) => (

              <ProductCard

                key={product.id}

                product={product}

                addToCartVariant="quantity"

                initialQuantity={
                  index === 2
                    ? 2
                    : 1
                }


                onQuantityChange={
                  (
                    item,
                    quantity,
                  ) => {

                    console.log(
                      "Quantity changed:",
                      item.id,
                      quantity,
                    );

                  }
                }


                onAddToCart={
                  (
                    item,
                    quantity,
                  ) => {

                    console.log(
                      "Add to cart:",
                      item.id,
                      quantity,
                    );

                  }
                }


                onFavoriteChange={
                  (
                    item,
                    nextValue,
                  ) => {

                    console.log(
                      "Favorite:",
                      item.id,
                      nextValue,
                    );

                  }
                }


                onProductClick={
                  (
                    item,
                  ) => {

                    console.log(
                      "Open product:",
                      item.slug,
                    );

                  }
                }

              />

            ),
          )
        }

      </div>


    </section>

  );

}
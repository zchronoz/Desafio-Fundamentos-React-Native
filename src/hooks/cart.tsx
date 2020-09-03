import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // await AsyncStorage.clear();
      const strItems = await AsyncStorage.getItem('products');

      if (strItems) {
        const produtos: Product[] = JSON.parse(strItems);
        setProducts(produtos);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const produto = products.find(p => p.id === id);

      if (produto) {
        produto.quantity += 1;
        setProducts([produto, ...products.filter(p => p.id !== produto.id)]);

        await AsyncStorage.clear();
        await AsyncStorage.setItem('products', JSON.stringify(products));
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const produto = products.find(p => p.id === id);

      if (produto) {
        produto.quantity -= 1;
        if (produto.quantity <= 0) {
          setProducts(products.filter(p => p.id !== id));
        } else {
          setProducts([produto, ...products.filter(p => p.id !== id)]);
        }

        await AsyncStorage.clear();

        if (products.length > 0) {
          await AsyncStorage.setItem('products', JSON.stringify(products));
        }
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const isExist = products.find(p => p.id === product.id);
      if (isExist) {
        await increment(product.id);
      } else {
        const newProduct: Product = {
          id: product.id,
          image_url: product.image_url,
          price: product.price,
          title: product.title,
          quantity: 1,
        };
        setProducts([...products, newProduct]);

        await AsyncStorage.clear();
        await AsyncStorage.setItem('products', JSON.stringify(products));
      }
    },
    [increment, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };

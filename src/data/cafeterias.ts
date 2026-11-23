
import type { ImageSourcePropType } from 'react-native';

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  quantity: number;
  image?: ImageSourcePropType;
};

export type Cafeteria = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  serviceInfo: string;
  categories: string[];
  logo?: string;
  menu: MenuItem[];
};

export type AvailabilityStatus =
  | 'available'
  | 'low-stock'
  | 'sold-out';

export function getAvailabilityStatus(
  item: MenuItem
): AvailabilityStatus {
  if (!item.available || item.quantity <= 0) {
    return 'sold-out';
  }

  if (item.quantity <= 5) {
    return 'low-stock';
  }

  return 'available';
}

export function getAvailabilityLabel(
  item: MenuItem
): string {
  const status = getAvailabilityStatus(item);

  if (status === 'sold-out') {
    return 'Sold Out';
  }

  if (status === 'low-stock') {
    return 'Low Stock';
  }

  return 'Available';
}

export const cafeterias: Cafeteria[] = [
  {
    id: 'general',
    name: 'General Cafeteria',
    description: 'Everyday meals and campus favourites',
    emoji: '🍛',
    serviceInfo:
      'Breakfast service ends at 10:00 a.m.; lunch ends at 4:00 p.m.',
    categories: ['All', 'Protein', 'Drinks', 'Food'],
    menu: [
      {
        id: 'general-1',
        name: 'Sautéed Sausages',
        description: 'A serving of sautéed sausages',
        price: 300,
        category: 'Protein',
        available: true,
        quantity: 19,
        image: require('../../assets/images/Food/sausage.jpg'),
      },
      {
        id: 'general-2',
        name: 'Boiled Yam',
        description: 'A serving of boiled yam',
        price: 400,
        category: 'Food',
        available: true,
        quantity: 5,
        image: require('../../assets/images/Food/yam.jpg'),
      },
      {
        id: 'general-3',
        name: 'Jollof Rice',
        description: 'A serving of jollof rice',
        price: 1500,
        category: 'Food',
        available: true,
        quantity: 20,
        image: require('../../assets/images/Food/jollof rice.jpg'),
      },
      {
        id: 'general-4',
        name: 'Fried Rice',
        description: 'A serving of fried rice',
        price: 1500,
        category: 'Food',
        available: true,
        quantity: 15,
        image: require('../../assets/images/Food/fried rice.jpg'),
      },
      {
        id: 'general-5',
        name: 'Chicken',
        description: 'A portion of chicken',
        price: 2000,
        category: 'Protein',
        available: true,
        quantity: 12,
        image: require('../../assets/images/Food/fried chicken.jpg'),
      },
    ],
  },
  {
    id: 'executive',
    name: 'Executive Cafeteria',
    description: 'Meals and refreshments',
    emoji: '🍽️',
    serviceInfo:
      'Breakfast service ends at 10:00 a.m.; lunch ends at 4:00 p.m.',
    categories: ['All', 'Snack', 'Drinks', 'Food'],
    menu: [
      {
        id: 'executive-1',
        name: 'Cookies',
        description: 'A serving of cookies',
        price: 650,
        category: 'Snack',
        available: true,
        quantity: 2,
        image: require('../../assets/images/Food/cookies.jpg'),
      },
      {
        id: 'executive-2',
        name: 'Fried Rice',
        description: 'A serving of fried rice',
        price: 500,
        category: 'Food',
        available: true,
        quantity: 104,
        image: require('../../assets/images/Food/fried rice.jpg'),
      },
      {
        id: 'executive-3',
        name: 'Spaghetti',
        description: 'A serving of spaghetti',
        price: 1800,
        category: 'Food',
        available: true,
        quantity: 15,
        image: require('../../assets/images/Food/Spaghetti.jpg'),
      },
      {
        id: 'executive-4',
        name: 'Grilled Chicken',
        description: 'A portion of grilled chicken',
        price: 2500,
        category: 'Food',
        available: true,
        quantity: 10,
        image: require('../../assets/images/Food/fried chicken.jpg'),
      },
    ],
  },
  {
    id: 'terrace',
    name: 'Terrace Café',
    description: 'Quick bites and refreshments',
    emoji: '☕',
    serviceInfo: 'Service ends by 4:00 p.m.',
    categories: ['All', 'Drinks', 'Beverage', 'Snack'],
    menu: [
      {
        id: 'terrace-1',
        name: 'Dano powdered milk',
        description: 'Powdered milk sachet',
        price: 200,
        category: 'Beverage',
        available: true,
        quantity: 9,
        image: require('../../assets/images/Food/Dano milk.jpg'),
      },
      {
        id: 'terrace-2',
        name: 'Maltina',
        description: 'Maltina malt drink',
        price: 800,
        category: 'Drinks',
        available: true,
        quantity: 15,
        image: require('../../assets/images/Food/multina.jpg'),
      },
      {
        id: 'terrace-3',
        name: 'Sandwich',
        description: 'Freshly prepared sandwich',
        price: 1800,
        category: 'Snack',
        available: true,
        quantity: 10,
        image: require('../../assets/images/Food/sandwich.jpg'),
      },
      {
        id: 'terrace-4',
        name: 'Fruit Juice',
        description: 'A refreshing fruit drink',
        price: 1200,
        category: 'Drinks',
        available: true,
        quantity: 12,
        image: require('../../assets/images/Food/fruit juice.jpg'),
      },
    ],
  },
  {
    id: 'sst',
    name: 'SST Snacks Bar',
    description: 'Snacks and light meals',
    emoji: '🥪',
    serviceInfo: 'Service ends by 4:00 p.m.',
    categories: ['All', 'Snack', 'Beverage', 'Drinks'],
    menu: [
      {
        id: 'sst-1',
        name: 'Burger',
        description: 'Freshly prepared burger',
        price: 1550,
        category: 'Snack',
        available: true,
        quantity: 15,
        image: require('../../assets/images/Food/burgar.jpg'),
      },
      {
        id: 'sst-2',
        name: 'Coffee 3 in 1 sachet',
        description: 'Instant coffee sachet',
        price: 350,
        category: 'Beverage',
        available: true,
        quantity: 11,
      },
      {
        id: 'sst-3',
        name: 'Meat Pie',
        description: 'Baked pastry with meat filling',
        price: 1000,
        category: 'Snack',
        available: true,
        quantity: 10,
        image: require('../../assets/images/Food/meat pie.jpg'),
      },
      {
        id: 'sst-4',
        name: 'Sausage Roll',
        description: 'Baked sausage pastry',
        price: 800,
        category: 'Snack',
        available: true,
        quantity: 12,
        image: require('../../assets/images/Food/sausage.jpg'),
      },
    ],
  },
  {
    id: 'heritage',
    name: 'Heritage Kitchen',
    description: 'Traditional meals and local favourites',
    emoji: '🥘',
    serviceInfo: 'Service hours to be confirmed.',
    categories: ['All', 'Soups', 'Swallow'],
    menu: [
      {
        id: 'heritage-1',
        name: 'Egusi Soup',
        description: 'A serving of egusi soup',
        price: 2000,
        category: 'Soups',
        available: true,
        quantity: 10,
        image: require('../../assets/images/Food/Egusi soup.jpg'),
      },
      {
        id: 'heritage-2',
        name: 'Pounded Yam',
        description: 'A serving of pounded yam',
        price: 1000,
        category: 'Swallow',
        available: true,
        quantity: 10,
        image: require('../../assets/images/Food/Pounded yam.jpg'),
      },
    ],
  },
];

export function getCafeteria(
  id: string
): Cafeteria | undefined {
  return cafeterias.find((store) => store.id === id);
}

# Lumiere - Modern E-Commerce WebApp

Welcome to **Lumiere**, a premium, fully responsive E-Commerce Web Application. Designed to work flawlessly across all devices (PC, Tablet, Android, iOS), this application provides a native-app-like experience on the web.

## ✨ Features

- **Fully Responsive Design:** Adapts perfectly to any screen size. Features a desktop-optimized top navigation and a mobile-optimized bottom navigation bar.
- **Cross-Platform Ready:** Works seamlessly on PCs, Macs, Android tablets, iPads, and all smartphones.
- **E-Commerce Functionality:** 
  - Product Grid with Category Filtering.
  - Detailed Product View with Color and Size selection.
  - Fully functional Shopping Cart (Add, Remove, Update Quantity).
  - Favorites/Wishlist system saved to your account.
- **Real-Time Chat Translation:** Communicate seamlessly with sellers from different countries. Messages are automatically translated to your preferred language using the Gemini API.
- **Multi-Language Support:** Choose between Burmese, English, Lao, Thai, and Chinese.
- **Seller & Buyer Roles:** Create an account, switch between buyer and seller roles. Sellers can list their own products with custom currencies.
- **Firebase Backend:** Real-time database and authentication powered by Firebase.

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations:** [Motion (Framer Motion)](https://motion.dev/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Backend:** Firebase (Auth, Firestore)
- **Translation:** Gemini API

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have Node.js installed on your computer.
- **Node.js:** v18.0.0 or higher is required.
- **Package Manager:** npm, yarn, or pnpm.

### Installation Steps

**1. Extract the project files**
Unzip the downloaded template file and open the folder in your terminal or code editor (e.g., VS Code).

**2. Install dependencies**
Run the following command to install all required packages:
```bash
npm install
```

**3. Set up Firebase**
Make sure you have a `firebase-applet-config.json` file in the root directory with your Firebase project configuration.

**4. Start the Development Server**
Run the following command to start the Vite development server:
```bash
npm run dev
```

**5. View the App**
Open your browser and navigate to `http://localhost:3000` (or the port shown in your terminal).

---

## 🎨 Customization Guide

### Changing Colors and Fonts
Open `src/index.css`. You can easily change the primary fonts and theme colors in the `@theme` block. The template currently uses the modern `Outfit` font.

### 🖼️ Assets & Images Disclaimer
This application uses real data from Firebase. There are no fake mock products. When you create an account and switch to the "Seller" role, you can add your own products with your own image URLs.

**Recommendation:** For product images, you can use free image hosting services or your own CDN, and paste the URL when adding a new product. Ensure you have the rights to use the images you upload.

## 📝 License

This template is provided under the standard digital asset marketplace license. Please refer to the marketplace terms for usage rights (e.g., personal vs. commercial use).

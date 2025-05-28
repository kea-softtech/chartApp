// src/utils/helpers.ts

// Helper function to generate a random RGBA color
export const getRandomColor = () =>
    `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.6)`;

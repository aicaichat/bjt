// frontend/src/utils/delay.ts
export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms)); 
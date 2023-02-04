import * as crypto from 'crypto';
import { FormattedMessage, MessageFormat } from './Types';


export const chunk = <T>(arr: T[], chunkSize: number): T[][] => {
  if(chunkSize < 1) return [arr];
  const chunks: T[][] = [];
  for(let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
};

export const distinct = (arr: any[]) => [... new Set(arr)];

export const uuid = (): string => crypto.randomUUID();

export const randomElement = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random()*arr.length)];
};

export const randomInt = (max: number, min: number = 0): number => Math.floor(Math.random() * max) + min;

export const formatMessage = (format: MessageFormat, text?: string, data?: any): FormattedMessage => ({ format, text, data });

export const isNullOrEmpty = (str: string): boolean => typeof str === 'undefined' || !str || typeof str !== "string" || str.length === 0;

export const getVersion = (): string => process.env.RELEASE_TAG || "0.0.0-local";

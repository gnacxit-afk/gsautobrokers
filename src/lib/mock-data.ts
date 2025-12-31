import type { Lead, Staff, Article } from './types';
import { PlaceHolderImages } from './placeholder-images';

// This file is now deprecated as we are using Firestore as the source of truth.
// The data has been seeded into your Firestore database.
// The constants below are still used for financial calculations.

export const REVENUE_PER_VEHICLE = 300;
export const COMMISSION_PER_VEHICLE = 75;
export const MARGIN_PER_VEHICLE = 225;

// Mock functions are kept to prevent breaking imports, but they return empty arrays.
export const getLeads = (): Lead[] => [];
export const getStaff = (): Staff[] => [];
export const getArticles = (): Article[] => [];
export const getArticleById = (id: string): Article | undefined => undefined;
export const getSalesData = () => [];
export const addStaffMember = (member: Omit<Staff, 'id' | 'hireDate' | 'avatarUrl'>): Staff => {
    return {} as Staff;
};
export const updateStaffMember = (id: string, updates: Partial<Staff>): boolean => true;
export const deleteStaffMember = (id: string): boolean => true;

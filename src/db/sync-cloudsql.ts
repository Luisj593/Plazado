import { db } from './index.ts';
import { users, categories, systemSettingsTable, advertisements } from './schema.ts';
import { INITIAL_CATEGORIES, INITIAL_USERS, INITIAL_SETTINGS, INITIAL_ADVERTISEMENTS } from '../data/initialData.ts';
import { eq } from 'drizzle-orm';

export async function initCloudSqlData() {
  try {
    console.log('[CloudSQL] Connecting to database...');

    // 1. Categories
    const existingCats = await db.select().from(categories);
    if (existingCats.length === 0) {
      console.log(`[CloudSQL] Seeding ${INITIAL_CATEGORIES.length} real categories...`);
      for (const cat of INITIAL_CATEGORIES) {
        await db.insert(categories).values({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description || null,
          icon: cat.icon || null,
          imageUrl: (cat as any).imageUrl || null,
          parentId: cat.parentId || null,
          order: cat.order || 0,
          isActive: true
        }).onConflictDoNothing();
      }
    }

    // 2. Users (Super Admins)
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      console.log(`[CloudSQL] Seeding Super Admin accounts...`);
      for (const u of INITIAL_USERS) {
        await db.insert(users).values({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          phone: u.phone || null,
          avatar: u.avatar || null,
          passwordHash: u.passwordHash || null,
          addresses: u.addresses || [],
        }).onConflictDoNothing();
      }
    }

    // 3. System Settings
    const existingSettings = await db.select().from(systemSettingsTable).where(eq(systemSettingsTable.id, 'default'));
    if (existingSettings.length === 0) {
      console.log('[CloudSQL] Seeding default system settings...');
      await db.insert(systemSettingsTable).values({
        id: 'default',
        marketplaceName: INITIAL_SETTINGS.platformName,
        supportPhone: INITIAL_SETTINGS.contactPhone,
        whatsappCommercial: INITIAL_SETTINGS.whatsappCommercial,
        contactEmail: INITIAL_SETTINGS.contactEmail,
        defaultCommissionRate: INITIAL_SETTINGS.defaultCommissionRate,
        minPayoutAmount: 1000,
        payoutSchedule: 'WEEKLY',
        autoApproveStores: false,
        maintenanceMode: false,
        allowedProvinces: [],
        rawConfig: INITIAL_SETTINGS as any,
      }).onConflictDoNothing();
    }

    // 4. Advertisements
    const existingAds = await db.select().from(advertisements);
    if (existingAds.length === 0 && INITIAL_ADVERTISEMENTS.length > 0) {
      console.log(`[CloudSQL] Seeding ${INITIAL_ADVERTISEMENTS.length} advertisements...`);
      for (const ad of INITIAL_ADVERTISEMENTS) {
        await db.insert(advertisements).values({
          id: ad.id,
          title: ad.title,
          description: ad.description || null,
          type: ad.type || 'INTERNAL',
          advertiserName: ad.advertiserName,
          placement: ad.placement,
          startDate: ad.startDate,
          endDate: ad.endDate,
          imageUrl: ad.imageUrl,
          mobileImageUrl: ad.mobileImageUrl || null,
          videoUrl: ad.videoUrl || null,
          ctaText: ad.ctaText || null,
          targetUrl: ad.targetUrl,
          targetWindow: ad.targetWindow || '_self',
          priority: ad.priority || 5,
          targetDevice: ad.targetDevice || 'ALL',
          targetCategory: ad.targetCategory || null,
          targetStoreId: ad.targetStoreId || null,
          sponsorStoreId: ad.sponsorStoreId || null,
          budget: ad.budget || null,
          isActive: ad.isActive !== false,
          impressions: ad.impressions || 0,
          clicks: ad.clicks || 0,
          order: ad.order || 0
        }).onConflictDoNothing();
      }
    }

    console.log('[CloudSQL] Seed synchronization complete.');
    return true;
  } catch (error) {
    console.error('[CloudSQL] Error during initial sync:', error);
    return false;
  }
}

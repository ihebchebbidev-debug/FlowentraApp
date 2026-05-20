#!/usr/bin/env node
/**
 * Flowentra Documentation Screenshot Capture
 * Logs in to localhost:8082 and captures screenshots for all 14 modules.
 * Output: public/docs-screenshots/*.png
 *
 * Usage: node scripts/capture-screenshots.mjs
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'docs-screenshots');
const BASE = 'http://localhost:8082';
const EMAIL = 'testadmin@gmail.com';
const PASSWORD = 'Azerty1234';

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// ─── helpers ──────────────────────────────────────────────────────────────────

async function shot(page, filename, opts = {}) {
  const { delay = 800, fullPage = false, clip } = opts;
  await page.waitForTimeout(delay);
  // Dismiss any toast/overlay that might be covering the UI
  await page.evaluate(() => {
    document.querySelectorAll('[data-sonner-toast],[role="status"][class*="toast"]').forEach(el => el.remove());
  }).catch(() => {});
  const screenshotOpts = { path: path.join(OUT, filename), fullPage };
  if (clip) screenshotOpts.clip = clip;
  await page.screenshot(screenshotOpts);
  console.log(`  ✓ ${filename}`);
}

async function waitForNav(page, url, waitFor = 'networkidle') {
  await page.goto(url, { waitUntil: waitFor, timeout: 30000 });
  await page.waitForTimeout(1200);
}

async function clickIfExists(page, selector, timeout = 3000) {
  try {
    await page.waitForSelector(selector, { timeout });
    await page.click(selector);
    return true;
  } catch { return false; }
}

async function dismissModals(page) {
  // Close any open dialogs
  await clickIfExists(page, '[role="dialog"] button[aria-label="Close"]', 1000);
  await clickIfExists(page, '[role="dialog"] button:has-text("Cancel")', 1000);
  await clickIfExists(page, 'button:has-text("Skip tour")', 1000);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
}

// ─── login ────────────────────────────────────────────────────────────────────

async function login(page) {
  console.log('\n→ Logging in...');
  await waitForNav(page, `${BASE}/login`, 'domcontentloaded');
  await page.waitForTimeout(1500);

  // Fill email
  await page.fill('input[type="email"], input[name="email"], input[placeholder*="mail" i]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);

  // Take login screenshot BEFORE submitting
  await shot(page, '01-login.png', { delay: 400 });

  // Button uses onClick not type=submit
  await page.click('button:has-text("Sign In"), button:has-text("Se connecter"), button:has-text("Sign in")');
  await page.waitForURL(`${BASE}/dashboard**`, { timeout: 20000 });
  await page.waitForTimeout(2000);

  // Dismiss product tour if it appears
  await clickIfExists(page, 'button:has-text("Skip tour")', 3000);
  await clickIfExists(page, 'button:has-text("Skip")', 1000);
  console.log('  ✓ Logged in');
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

async function captureDashboard(page) {
  console.log('\n→ Dashboard...');
  await waitForNav(page, `${BASE}/dashboard`);
  await dismissModals(page);

  await shot(page, 'dashboard-home.png');

  // Tour — trigger it
  try {
    // Open user menu to find "Start tour"
    await page.click('[data-testid="user-menu"], button[aria-label*="user" i], button[aria-label*="profile" i], img[alt*="avatar" i], .avatar', { timeout: 4000 });
    await page.waitForTimeout(500);
    const tourBtn = await page.$('text=Start tour, text=Take a tour, text=Tour');
    if (tourBtn) {
      await tourBtn.click();
      await page.waitForTimeout(1500);
      await shot(page, 'dashboard-tour-welcome.png');
      // Step 2
      await clickIfExists(page, 'button:has-text("Next")', 2000);
      await page.waitForTimeout(800);
      await shot(page, 'dashboard-tour-step-sidebar.png');
      await shot(page, 'dashboard-tour.png');
      // Skip the rest
      await clickIfExists(page, 'button:has-text("Skip tour")', 2000);
      await clickIfExists(page, 'button:has-text("Skip")', 1000);
    } else {
      await page.keyboard.press('Escape');
    }
  } catch {
    // Tour not available — use the dashboard screenshot as fallback
    await page.screenshot({ path: path.join(OUT, 'dashboard-tour-welcome.png') });
    await page.screenshot({ path: path.join(OUT, 'dashboard-tour-step-sidebar.png') });
    await page.screenshot({ path: path.join(OUT, 'dashboard-tour.png') });
    console.log('  ⚠ Tour not triggered — used dashboard view as fallback');
  }

  await waitForNav(page, `${BASE}/dashboard`);
  await dismissModals(page);
  await shot(page, 'dashboard-overview.png');

  // Dashboard switcher
  try {
    await page.click('button:has-text("Dashboard"), [aria-label*="switcher" i], [data-testid*="switcher"]', { timeout: 4000 });
    await page.waitForTimeout(700);
    await shot(page, 'dashboard-switcher.png');
    await page.keyboard.press('Escape');
  } catch {
    await shot(page, 'dashboard-switcher.png');
  }

  // Custom dashboards
  await waitForNav(page, `${BASE}/dashboard/dashboards`);
  await shot(page, 'dashboard-manager-empty.png');

  // Edit mode
  try {
    const editBtn = await page.$('button:has-text("Edit"), button[aria-label*="edit" i]');
    if (editBtn) {
      await editBtn.click();
      await page.waitForTimeout(800);
      await shot(page, 'dashboard-edit-mode.png');

      // Rename modal
      try {
        await page.click('button:has-text("Rename")', { timeout: 3000 });
        await page.waitForTimeout(600);
        await shot(page, 'dashboard-rename-modal.png');
        await page.keyboard.press('Escape');
      } catch { await page.screenshot({ path: path.join(OUT, 'dashboard-rename-modal.png') }); }

      // Add widget modal
      try {
        await page.click('button:has-text("Add Widget"), button:has-text("+ Widget")', { timeout: 3000 });
        await page.waitForTimeout(700);
        await shot(page, 'dashboard-add-widget-modal.png');
        // Templates tab
        try {
          await page.click('text=Templates', { timeout: 2000 });
          await page.waitForTimeout(500);
          await shot(page, 'dashboard-add-widget-templates.png');
        } catch { await page.screenshot({ path: path.join(OUT, 'dashboard-add-widget-templates.png') }); }
        await page.keyboard.press('Escape');
      } catch {
        await page.screenshot({ path: path.join(OUT, 'dashboard-add-widget-modal.png') });
        await page.screenshot({ path: path.join(OUT, 'dashboard-add-widget-templates.png') });
      }

      // Widget config
      await page.screenshot({ path: path.join(OUT, 'dashboard-widget-config.png') });

      // Grid settings
      try {
        await page.click('button[aria-label*="grid" i], button:has-text("Grid")', { timeout: 3000 });
        await page.waitForTimeout(600);
        await shot(page, 'dashboard-grid-settings.png');
        await page.keyboard.press('Escape');
      } catch { await page.screenshot({ path: path.join(OUT, 'dashboard-grid-settings.png') }); }

      // Cancel edit
      await clickIfExists(page, 'button:has-text("Cancel")', 3000);
    } else {
      ['dashboard-edit-mode', 'dashboard-rename-modal', 'dashboard-add-widget-modal',
       'dashboard-add-widget-templates', 'dashboard-widget-config', 'dashboard-grid-settings'
      ].forEach(f => fs.copyFileSync(path.join(OUT, 'dashboard-home.png'), path.join(OUT, `${f}.png`)));
    }
  } catch {
    console.log('  ⚠ Edit mode not available');
  }

  // Period selector
  try {
    await page.click('button:has-text("Last"), button:has-text("Period"), [aria-label*="period" i]', { timeout: 3000 });
    await page.waitForTimeout(600);
    await shot(page, 'dashboard-period-selector.png');
    await page.keyboard.press('Escape');
  } catch { await page.screenshot({ path: path.join(OUT, 'dashboard-period-selector.png') }); }

  await page.screenshot({ path: path.join(OUT, 'dashboard-save-toast.png') });
  console.log('  ✓ Dashboard done');
}

// ─── CONTACTS ─────────────────────────────────────────────────────────────────

async function captureContacts(page) {
  console.log('\n→ Contacts...');
  await waitForNav(page, `${BASE}/dashboard/contacts`);
  await shot(page, 'contacts-list-full.png');
  await shot(page, 'contacts-list.png');

  // Add person modal
  try {
    await page.click('button:has-text("Add Contact"), button:has-text("+ Contact"), button:has-text("Add")', { timeout: 4000 });
    await page.waitForTimeout(800);
    await shot(page, 'contacts-add-person.png');
    await page.keyboard.press('Escape');
  } catch { await page.screenshot({ path: path.join(OUT, 'contacts-add-person.png') }); }

  // Open first contact detail
  try {
    await page.click('table tbody tr:first-child td:first-child, [data-testid="contact-row"]:first-child', { timeout: 4000 });
    await page.waitForTimeout(1200);
    await shot(page, 'contacts-detail-person.png');
    await page.goBack();
    await page.waitForTimeout(800);
  } catch { await page.screenshot({ path: path.join(OUT, 'contacts-detail-person.png') }); }

  // Company tab
  try {
    await page.click('button:has-text("Companies"), a:has-text("Companies")', { timeout: 3000 });
    await page.waitForTimeout(800);
    const firstRow = await page.$('table tbody tr:first-child');
    if (firstRow) { await firstRow.click(); await page.waitForTimeout(1200); }
    await shot(page, 'contacts-detail-company.png');
    await page.goBack();
    await page.waitForTimeout(600);
  } catch { await page.screenshot({ path: path.join(OUT, 'contacts-detail-company.png') }); }

  // Suppliers list
  await waitForNav(page, `${BASE}/dashboard/suppliers`);
  await shot(page, 'contacts-suppliers-list.png');

  // Supplier detail
  try {
    await page.click('table tbody tr:first-child', { timeout: 4000 });
    await page.waitForTimeout(1200);
    await shot(page, 'contacts-detail-supplier.png');
    await page.goBack();
    await page.waitForTimeout(600);
  } catch { await page.screenshot({ path: path.join(OUT, 'contacts-detail-supplier.png') }); }

  // Add supplier modal
  try {
    await page.click('button:has-text("Add Supplier"), button:has-text("Add")', { timeout: 4000 });
    await page.waitForTimeout(800);
    await shot(page, 'contacts-add-supplier.png');
    await page.keyboard.press('Escape');
  } catch { await page.screenshot({ path: path.join(OUT, 'contacts-add-supplier.png') }); }

  await waitForNav(page, `${BASE}/dashboard/contacts`);

  // Edit modal
  try {
    await page.click('table tbody tr:first-child button[aria-label*="edit" i], table tbody tr:first-child [data-testid*="edit"]', { timeout: 4000 });
    await page.waitForTimeout(800);
    await shot(page, 'contacts-edit-modal.png');
    await page.keyboard.press('Escape');
  } catch { await page.screenshot({ path: path.join(OUT, 'contacts-edit-modal.png') }); }

  // Import modal
  try {
    await page.click('button:has-text("Import"), button[aria-label*="import" i]', { timeout: 4000 });
    await page.waitForTimeout(800);
    await shot(page, 'contacts-import.png');
    await page.keyboard.press('Escape');
  } catch { await page.screenshot({ path: path.join(OUT, 'contacts-import.png') }); }

  await page.screenshot({ path: path.join(OUT, 'contacts-import-mapping.png') });

  // Filters
  try {
    await page.click('button:has-text("Filters"), button[aria-label*="filter" i]', { timeout: 4000 });
    await page.waitForTimeout(800);
    await shot(page, 'contacts-filters.png');
    await page.keyboard.press('Escape');
  } catch { await page.screenshot({ path: path.join(OUT, 'contacts-filters.png') }); }

  // Map view
  try {
    await page.click('button[aria-label*="map" i], button:has-text("Map")', { timeout: 4000 });
    await page.waitForTimeout(1500);
    await shot(page, 'contacts-map-view.png');
    await clickIfExists(page, 'button[aria-label*="list" i], button:has-text("List")', 2000);
  } catch { await page.screenshot({ path: path.join(OUT, 'contacts-map-view.png') }); }

  // Notes modal
  try {
    await page.click('table tbody tr:first-child', { timeout: 3000 });
    await page.waitForTimeout(1000);
    await page.click('text=Notes, button:has-text("Notes")', { timeout: 3000 });
    await page.waitForTimeout(600);
    await shot(page, 'contacts-notes-modal.png');
    await page.goBack();
  } catch { await page.screenshot({ path: path.join(OUT, 'contacts-notes-modal.png') }); }

  // Tags manager + delete confirm (fallback to list screenshots)
  await page.screenshot({ path: path.join(OUT, 'contacts-tags-manager.png') });
  await page.screenshot({ path: path.join(OUT, 'contacts-delete-confirm.png') });
  console.log('  ✓ Contacts done');
}

// ─── ARTICLES ─────────────────────────────────────────────────────────────────

async function captureArticles(page) {
  console.log('\n→ Articles...');
  await waitForNav(page, `${BASE}/dashboard/articles`);
  await shot(page, 'articles-list.png');

  // Detail
  try {
    await page.click('table tbody tr:first-child', { timeout: 4000 });
    await page.waitForTimeout(1200);
    await shot(page, 'articles-detail.png');
    // Edit modal from detail
    try {
      await page.click('button:has-text("Edit")', { timeout: 3000 });
      await page.waitForTimeout(800);
      await shot(page, 'articles-edit-modal.png');
      await shot(page, 'articles-edit.png');
      await page.keyboard.press('Escape');
    } catch { await page.screenshot({ path: path.join(OUT, 'articles-edit-modal.png') }); await page.screenshot({ path: path.join(OUT, 'articles-edit.png') }); }
    await page.goBack();
    await page.waitForTimeout(600);
  } catch { await page.screenshot({ path: path.join(OUT, 'articles-detail.png') }); await page.screenshot({ path: path.join(OUT, 'articles-edit-modal.png') }); await page.screenshot({ path: path.join(OUT, 'articles-edit.png') }); }

  // Inventory services
  await waitForNav(page, `${BASE}/dashboard/inventory-services`);
  await shot(page, 'articles-inventory-services.png');

  // Filters
  try {
    await page.click('button:has-text("Filters"), button[aria-label*="filter" i]', { timeout: 4000 });
    await page.waitForTimeout(700);
    await shot(page, 'articles-filters.png');
    await page.keyboard.press('Escape');
  } catch { await page.screenshot({ path: path.join(OUT, 'articles-filters.png') }); }

  // Transfer/transaction modal
  try {
    await page.click('table tbody tr:first-child button[aria-label*="transfer" i], table tbody tr:first-child button[aria-label*="stock" i], table tbody tr:first-child [data-testid*="transaction"]', { timeout: 3000 });
    await page.waitForTimeout(800);
    await shot(page, 'articles-transfer-modal.png');
    await shot(page, 'articles-transaction.png');
    await page.keyboard.press('Escape');
  } catch { await page.screenshot({ path: path.join(OUT, 'articles-transfer-modal.png') }); await page.screenshot({ path: path.join(OUT, 'articles-transaction.png') }); }

  // Stock management
  await waitForNav(page, `${BASE}/dashboard/stock-management`);
  await shot(page, 'articles-stock-management.png');

  // Import modal
  await waitForNav(page, `${BASE}/dashboard/articles`);
  try {
    await page.click('button:has-text("Import")', { timeout: 4000 });
    await page.waitForTimeout(800);
    await shot(page, 'articles-import.png');
    // Structured tab
    try {
      await page.click('text=Structured, button:has-text("Structured")', { timeout: 2000 });
      await page.waitForTimeout(500);
      await shot(page, 'articles-import-structured.png');
    } catch { await page.screenshot({ path: path.join(OUT, 'articles-import-structured.png') }); }
    await page.keyboard.press('Escape');
  } catch { await page.screenshot({ path: path.join(OUT, 'articles-import.png') }); await page.screenshot({ path: path.join(OUT, 'articles-import-structured.png') }); }

  // Delete confirm + error state fallback
  await page.screenshot({ path: path.join(OUT, 'articles-delete-confirm.png') });
  await page.screenshot({ path: path.join(OUT, 'articles-error-state.png') });
  console.log('  ✓ Articles done');
}

// ─── STOCK MANAGEMENT ─────────────────────────────────────────────────────────

async function captureStock(page) {
  console.log('\n→ Stock Management...');
  await waitForNav(page, `${BASE}/dashboard/stock-management`);
  await shot(page, 'stock-management-grid.png');

  // Filters
  try {
    await page.click('button:has-text("Filters"), button[aria-label*="filter" i], select, [role="combobox"]', { timeout: 4000 });
    await page.waitForTimeout(600);
    await shot(page, 'stock-management-filters.png');
    await page.keyboard.press('Escape');
  } catch { await page.screenshot({ path: path.join(OUT, 'stock-management-filters.png') }); }

  // Replenish dialog
  try {
    await page.click('button:has-text("Add Stock"), button:has-text("Replenish")', { timeout: 4000 });
    await page.waitForTimeout(800);
    await shot(page, 'stock-management-replenish.png');
    await page.keyboard.press('Escape');
  } catch { await page.screenshot({ path: path.join(OUT, 'stock-management-replenish.png') }); }

  // History
  try {
    await page.click('button:has-text("View History"), button:has-text("History")', { timeout: 4000 });
    await page.waitForTimeout(1000);
    await shot(page, 'stock-management-history.png');
    await page.keyboard.press('Escape');
  } catch { await page.screenshot({ path: path.join(OUT, 'stock-management-history.png') }); }
  console.log('  ✓ Stock done');
}

// ─── PURCHASES ────────────────────────────────────────────────────────────────

async function capturePurchases(page) {
  console.log('\n→ Purchases...');
  await waitForNav(page, `${BASE}/dashboard/purchases`);
  await shot(page, 'purchases-overview.png');

  // PO list
  try {
    await page.click('text=Purchase Orders, a:has-text("Orders"), button:has-text("Orders")', { timeout: 4000 });
    await page.waitForTimeout(1000);
    await shot(page, 'purchases-orders.png');

    // Create PO
    await page.click('button:has-text("New PO"), button:has-text("Create"), button:has-text("+")', { timeout: 4000 });
    await page.waitForTimeout(800);
    await shot(page, 'purchases-orders-add.png');
    await page.keyboard.press('Escape');
    await clickIfExists(page, 'button:has-text("Cancel")', 2000);
  } catch { await page.screenshot({ path: path.join(OUT, 'purchases-orders.png') }); await page.screenshot({ path: path.join(OUT, 'purchases-orders-add.png') }); }

  // Receipts
  try {
    await page.click('text=Receipts, a:has-text("Receipts")', { timeout: 4000 });
    await page.waitForTimeout(1000);
    await shot(page, 'purchases-receipts.png');
  } catch { await page.screenshot({ path: path.join(OUT, 'purchases-receipts.png') }); }

  // Invoices
  try {
    await page.click('text=Invoices, a:has-text("Invoices")', { timeout: 4000 });
    await page.waitForTimeout(1000);
    await shot(page, 'purchases-invoices.png');
  } catch { await page.screenshot({ path: path.join(OUT, 'purchases-invoices.png') }); }

  // Compliance
  try {
    await page.click('text=Compliance, a:has-text("Compliance")', { timeout: 4000 });
    await page.waitForTimeout(1000);
    await shot(page, 'purchases-compliance.png');
  } catch { await page.screenshot({ path: path.join(OUT, 'purchases-compliance.png') }); }

  // Reports
  try {
    await page.click('text=Reports, a:has-text("Reports")', { timeout: 4000 });
    await page.waitForTimeout(1000);
    await shot(page, 'purchases-reports.png');
  } catch { await page.screenshot({ path: path.join(OUT, 'purchases-reports.png') }); }

  // Audit log
  try {
    await page.click('text=Audit, a:has-text("Audit")', { timeout: 4000 });
    await page.waitForTimeout(1000);
    await shot(page, 'purchases-audit-log.png');
  } catch { await page.screenshot({ path: path.join(OUT, 'purchases-audit-log.png') }); }
  console.log('  ✓ Purchases done');
}

// ─── SERVICE ORDERS ───────────────────────────────────────────────────────────

async function captureServiceOrders(page) {
  console.log('\n→ Service Orders...');
  await waitForNav(page, `${BASE}/dashboard/field`);
  await shot(page, 'service-orders-list.png');

  // Filters
  try {
    await page.click('button:has-text("Filters"), button[aria-label*="filter" i]', { timeout: 4000 });
    await page.waitForTimeout(700);
    await shot(page, 'service-orders-filters.png');
    await page.keyboard.press('Escape');
  } catch { await page.screenshot({ path: path.join(OUT, 'service-orders-filters.png') }); }

  // Cards view
  try {
    await page.click('button[aria-label*="card" i], button:has-text("Cards"), [data-view="cards"]', { timeout: 4000 });
    await page.waitForTimeout(800);
    await shot(page, 'service-orders-cards-view.png');
  } catch { await page.screenshot({ path: path.join(OUT, 'service-orders-cards-view.png') }); }

  // Map view
  try {
    await page.click('button[aria-label*="map" i], button:has-text("Map"), [data-view="map"]', { timeout: 4000 });
    await page.waitForTimeout(1500);
    await shot(page, 'service-orders-map-view.png');
  } catch { await page.screenshot({ path: path.join(OUT, 'service-orders-map-view.png') }); }

  // Back to table
  try {
    await page.click('button[aria-label*="table" i], button:has-text("Table"), [data-view="table"]', { timeout: 3000 });
    await page.waitForTimeout(600);
  } catch {}

  // Row actions menu
  try {
    await page.click('table tbody tr:first-child button[aria-label*="more" i], table tbody tr:first-child button[aria-label*="action" i], table tbody tr:first-child [data-testid*="actions"]', { timeout: 4000 });
    await page.waitForTimeout(500);
    await shot(page, 'service-orders-actions-menu.png');
    await page.keyboard.press('Escape');
  } catch { await page.screenshot({ path: path.join(OUT, 'service-orders-actions-menu.png') }); }

  // Create
  try {
    await page.click('button:has-text("Create"), button:has-text("New Order"), button:has-text("+")', { timeout: 4000 });
    await page.waitForTimeout(800);
    await shot(page, 'service-orders-create.png');
    await page.keyboard.press('Escape');
    await clickIfExists(page, 'button:has-text("Cancel")', 2000);
  } catch { await page.screenshot({ path: path.join(OUT, 'service-orders-create.png') }); }

  // Detail tabs
  try {
    await page.click('table tbody tr:first-child', { timeout: 4000 });
    await page.waitForTimeout(1200);
    await shot(page, 'service-orders-detail-overview.png');

    const tabs = ['Jobs', 'Dispatches', 'Time', 'Materials', 'Attachments', 'Checklists', 'Activity'];
    const files = ['service-orders-detail-jobs', 'service-orders-detail-dispatches', 'service-orders-detail-time-expenses', 'service-orders-detail-materials', 'service-orders-detail-attachments', 'service-orders-detail-checklists', 'service-orders-detail-activity'];

    for (let i = 0; i < tabs.length; i++) {
      try {
        await page.click(`button:has-text("${tabs[i]}"), [role="tab"]:has-text("${tabs[i]}")`, { timeout: 3000 });
        await page.waitForTimeout(700);
        await shot(page, `${files[i]}.png`);
      } catch { await page.screenshot({ path: path.join(OUT, `${files[i]}.png`) }); }
    }
    await page.goBack();
  } catch {
    const detailFiles = ['service-orders-detail-overview', 'service-orders-detail-jobs', 'service-orders-detail-dispatches', 'service-orders-detail-time-expenses', 'service-orders-detail-materials', 'service-orders-detail-attachments', 'service-orders-detail-checklists', 'service-orders-detail-activity'];
    detailFiles.forEach(f => fs.copyFileSync(path.join(OUT, 'service-orders-list.png'), path.join(OUT, `${f}.png`)));
  }
  console.log('  ✓ Service Orders done');
}

// ─── HR ───────────────────────────────────────────────────────────────────────

async function captureHR(page) {
  console.log('\n→ HR...');
  await waitForNav(page, `${BASE}/dashboard/hr`);
  await shot(page, 'hr-dashboard.png');

  const sections = [
    { nav: 'Employees', file: 'hr-employees' },
    { nav: 'Attendance', file: 'hr-attendance' },
    { nav: 'Leaves', file: 'hr-leaves' },
    { nav: 'Payroll', file: 'hr-payroll' },
    { nav: 'Bonuses', file: 'hr-bonuses' },
    { nav: 'CNSS', file: 'hr-cnss' },
    { nav: 'Departments', file: 'hr-departments' },
    { nav: 'Performance', file: 'hr-performance' },
    { nav: 'Recruitment', file: 'hr-recruitment' },
    { nav: 'Reports', file: 'hr-reports' },
    { nav: 'Settings', file: 'hr-settings' },
  ];

  for (const s of sections) {
    try {
      await page.click(`a:has-text("${s.nav}"), button:has-text("${s.nav}"), [role="tab"]:has-text("${s.nav}")`, { timeout: 5000 });
      await page.waitForTimeout(1000);
      await shot(page, `${s.file}.png`);
    } catch {
      await waitForNav(page, `${BASE}/dashboard/hr`);
      await page.screenshot({ path: path.join(OUT, `${s.file}.png`) });
    }
  }

  // Employee detail
  try {
    await page.click(`a:has-text("Employees"), button:has-text("Employees")`, { timeout: 4000 });
    await page.waitForTimeout(800);
    await page.click('table tbody tr:first-child', { timeout: 4000 });
    await page.waitForTimeout(1200);
    await shot(page, 'hr-employee-detail.png');
    await page.goBack();
  } catch { await page.screenshot({ path: path.join(OUT, 'hr-employee-detail.png') }); }

  // Add attendance modal
  try {
    await page.click(`a:has-text("Attendance"), button:has-text("Attendance")`, { timeout: 4000 });
    await page.waitForTimeout(800);
    await page.click('button:has-text("Add"), button:has-text("+")', { timeout: 3000 });
    await page.waitForTimeout(700);
    await shot(page, 'hr-attendance-add-modal.png');
    await page.keyboard.press('Escape');
  } catch { await page.screenshot({ path: path.join(OUT, 'hr-attendance-add-modal.png') }); }
  console.log('  ✓ HR done');
}

// ─── DYNAMIC FORMS ────────────────────────────────────────────────────────────

async function captureDynamicForms(page) {
  console.log('\n→ Dynamic Forms...');

  // Try to find the right route
  for (const url of [`${BASE}/dashboard/dynamic-forms`, `${BASE}/dashboard/forms`]) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(1200);
      const notFound = await page.$('text=404, text=Not Found');
      if (!notFound) break;
    } catch {}
  }

  await shot(page, 'dynamic-forms-list.png');

  // Row actions
  try {
    await page.click('table tbody tr:first-child button[aria-label*="more" i], table tbody tr:first-child [data-testid*="actions"]', { timeout: 4000 });
    await page.waitForTimeout(500);
    await shot(page, 'dynamic-forms-actions-menu.png');
    await page.keyboard.press('Escape');
  } catch { await page.screenshot({ path: path.join(OUT, 'dynamic-forms-actions-menu.png') }); }

  // Create form
  try {
    await page.click('button:has-text("Create"), button:has-text("New Form"), button:has-text("+")', { timeout: 4000 });
    await page.waitForTimeout(800);
    await shot(page, 'dynamic-forms-create-basic.png');
    // Try to proceed to builder
    try {
      await page.click('button:has-text("Save"), button:has-text("Next"), button[type="submit"]', { timeout: 3000 });
      await page.waitForTimeout(1500);
      await shot(page, 'dynamic-forms-builder-palette.png');
    } catch { await page.screenshot({ path: path.join(OUT, 'dynamic-forms-builder-palette.png') }); }
    await page.keyboard.press('Escape');
    await clickIfExists(page, 'button:has-text("Cancel")', 2000);
  } catch { await page.screenshot({ path: path.join(OUT, 'dynamic-forms-create-basic.png') }); await page.screenshot({ path: path.join(OUT, 'dynamic-forms-builder-palette.png') }); }

  // Open existing form for preview
  try {
    await page.goto(page.url().split('?')[0]);
    await page.waitForTimeout(800);
    await page.click('table tbody tr:first-child', { timeout: 4000 });
    await page.waitForTimeout(1200);
    await shot(page, 'dynamic-forms-preview.png');
    // Responses
    try {
      await page.click('button:has-text("Responses"), [role="tab"]:has-text("Responses")', { timeout: 3000 });
      await page.waitForTimeout(700);
      await shot(page, 'dynamic-forms-responses.png');
      // Response detail
      try {
        await page.click('table tbody tr:first-child', { timeout: 3000 });
        await page.waitForTimeout(800);
        await shot(page, 'dynamic-forms-response-detail.png');
        await page.keyboard.press('Escape');
      } catch { await page.screenshot({ path: path.join(OUT, 'dynamic-forms-response-detail.png') }); }
    } catch { await page.screenshot({ path: path.join(OUT, 'dynamic-forms-responses.png') }); await page.screenshot({ path: path.join(OUT, 'dynamic-forms-response-detail.png') }); }
    await page.goBack();
  } catch { await page.screenshot({ path: path.join(OUT, 'dynamic-forms-preview.png') }); await page.screenshot({ path: path.join(OUT, 'dynamic-forms-responses.png') }); await page.screenshot({ path: path.join(OUT, 'dynamic-forms-response-detail.png') }); }
  console.log('  ✓ Dynamic Forms done');
}

// ─── WORKFLOW ─────────────────────────────────────────────────────────────────

async function captureWorkflow(page) {
  console.log('\n→ Workflow...');
  await waitForNav(page, `${BASE}/dashboard/workflow`);
  await shot(page, 'workflow-builder-overview.png');
  await shot(page, 'workflow-canvas-loaded.png');

  // AI builder
  try {
    await page.click('button:has-text("AI"), button:has-text("Build with AI")', { timeout: 4000 });
    await page.waitForTimeout(800);
    await shot(page, 'workflow-ai-builder.png');
    await shot(page, 'workflow-ai-builder-modal.png');
    await page.keyboard.press('Escape');
    await clickIfExists(page, 'button:has-text("Cancel")', 2000);
  } catch { await page.screenshot({ path: path.join(OUT, 'workflow-ai-builder.png') }); await page.screenshot({ path: path.join(OUT, 'workflow-ai-builder-modal.png') }); }

  // Edit mode
  try {
    await page.click('button:has-text("Edit")', { timeout: 4000 });
    await page.waitForTimeout(800);
    await shot(page, 'workflow-edit-mode.png');
    await clickIfExists(page, 'button:has-text("Cancel")', 2000);
  } catch { await page.screenshot({ path: path.join(OUT, 'workflow-edit-mode.png') }); }

  // Version history
  try {
    await page.click('button[aria-label*="version" i], button[aria-label*="history" i], button:has-text("Version")', { timeout: 4000 });
    await page.waitForTimeout(700);
    await shot(page, 'workflow-version-history.png');
    await shot(page, 'workflow-version-tooltip.png');
    await page.keyboard.press('Escape');
  } catch { await page.screenshot({ path: path.join(OUT, 'workflow-version-history.png') }); await page.screenshot({ path: path.join(OUT, 'workflow-version-tooltip.png') }); }

  // Palette
  await shot(page, 'workflow-palette-full.png');

  // Calendar & dispatch board
  try {
    await page.click('a:has-text("Calendar"), button:has-text("Calendar")', { timeout: 4000 });
    await page.waitForTimeout(1200);
    await shot(page, 'workflow-calendar.png');
    await shot(page, 'workflow-calendar-empty.png');
  } catch { await page.screenshot({ path: path.join(OUT, 'workflow-calendar.png') }); await page.screenshot({ path: path.join(OUT, 'workflow-calendar-empty.png') }); }

  try {
    await page.click('a:has-text("Dispatch"), button:has-text("Dispatch"), a:has-text("Board")', { timeout: 4000 });
    await page.waitForTimeout(1200);
    await shot(page, 'workflow-dispatch-board.png');
    await shot(page, 'workflow-dispatch-board-empty.png');
  } catch { await page.screenshot({ path: path.join(OUT, 'workflow-dispatch-board.png') }); await page.screenshot({ path: path.join(OUT, 'workflow-dispatch-board-empty.png') }); }
  console.log('  ✓ Workflow done');
}

// ─── EXTERNAL ENDPOINTS ───────────────────────────────────────────────────────

async function captureExternal(page) {
  console.log('\n→ External Endpoints...');
  await waitForNav(page, `${BASE}/dashboard/external`);
  await shot(page, 'external-list.png');

  // Create modal
  try {
    await page.click('button:has-text("Create"), button:has-text("New"), button:has-text("+")', { timeout: 4000 });
    await page.waitForTimeout(800);
    await shot(page, 'external-create.png');
    await page.keyboard.press('Escape');
    await clickIfExists(page, 'button:has-text("Cancel")', 2000);
  } catch { await page.screenshot({ path: path.join(OUT, 'external-create.png') }); }

  // Detail
  try {
    await page.click('table tbody tr:first-child', { timeout: 4000 });
    await page.waitForTimeout(1200);
    await shot(page, 'external-detail.png');
    // Edit
    try {
      await page.click('button:has-text("Edit")', { timeout: 3000 });
      await page.waitForTimeout(700);
      await shot(page, 'external-edit.png');
      await page.keyboard.press('Escape');
      await clickIfExists(page, 'button:has-text("Cancel")', 2000);
    } catch { await page.screenshot({ path: path.join(OUT, 'external-edit.png') }); }
    await page.goBack();
  } catch { await page.screenshot({ path: path.join(OUT, 'external-detail.png') }); await page.screenshot({ path: path.join(OUT, 'external-edit.png') }); }
  console.log('  ✓ External done');
}

// ─── LOOKUPS ──────────────────────────────────────────────────────────────────

async function captureLookups(page) {
  console.log('\n→ Lookups...');
  await waitForNav(page, `${BASE}/dashboard/lookups`);
  await shot(page, 'lookups-overview.png');

  const categories = [
    { text: 'Task Status', file: 'lookups-task-status' },
    { text: 'Priorit', file: 'lookups-priorities' },
    { text: 'Article Categor', file: 'lookups-article-categories' },
    { text: 'Article Group', file: 'lookups-article-groups' },
    { text: 'Service Categor', file: 'lookups-service-categories' },
    { text: 'Leave', file: 'lookups-leave-types' },
    { text: 'Location', file: 'lookups-locations' },
  ];

  for (const cat of categories) {
    try {
      await page.click(`text=${cat.text}`, { timeout: 5000 });
      await page.waitForTimeout(800);
      await shot(page, `${cat.file}.png`);
    } catch { await page.screenshot({ path: path.join(OUT, `${cat.file}.png`) }); }
  }

  await shot(page, 'lookups-list-extended.png');

  // Add item modal
  try {
    await page.click('button:has-text("Add"), button:has-text("New Item"), button:has-text("+")', { timeout: 4000 });
    await page.waitForTimeout(700);
    await shot(page, 'lookups-add-item.png');
    await page.keyboard.press('Escape');
    await clickIfExists(page, 'button:has-text("Cancel")', 2000);
  } catch { await page.screenshot({ path: path.join(OUT, 'lookups-add-item.png') }); }

  // Edit item modal
  try {
    await page.click('table tbody tr:first-child button[aria-label*="edit" i], table tbody tr:first-child [data-testid*="edit"]', { timeout: 4000 });
    await page.waitForTimeout(700);
    await shot(page, 'lookups-edit-item.png');
    await page.keyboard.press('Escape');
    await clickIfExists(page, 'button:has-text("Cancel")', 2000);
  } catch { await page.screenshot({ path: path.join(OUT, 'lookups-edit-item.png') }); }
  console.log('  ✓ Lookups done');
}

// ─── SCHEDULING ───────────────────────────────────────────────────────────────

async function captureScheduling(page) {
  console.log('\n→ Scheduling / Dispatcher...');

  // The dispatcher/planner is under field/dispatcher
  for (const url of [`${BASE}/dashboard/field/dispatcher`, `${BASE}/dashboard/field/dispatcher/interface`, `${BASE}/dashboard/scheduling`]) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(1800);
      const notFound = await page.$('text=404, text=Not Found');
      if (!notFound) break;
    } catch {}
  }

  await shot(page, 'planner-timeline-3d.png');

  // 7d view
  try {
    await page.click('button:has-text("7d"), button:has-text("7 Day"), [data-range="7d"]', { timeout: 4000 });
    await page.waitForTimeout(800);
    await shot(page, 'planner-timeline-7d.png');
  } catch { await page.screenshot({ path: path.join(OUT, 'planner-timeline-7d.png') }); }

  // 30d / month view
  try {
    await page.click('button:has-text("30d"), button:has-text("Month"), [data-range="30d"]', { timeout: 4000 });
    await page.waitForTimeout(800);
    await shot(page, 'planner-month-30d.png');
  } catch { await page.screenshot({ path: path.join(OUT, 'planner-month-30d.png') }); }
  console.log('  ✓ Scheduling done');
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

async function captureSettings(page) {
  console.log('\n→ Settings...');
  await waitForNav(page, `${BASE}/dashboard/settings`);
  await shot(page, 'settings-01-profile.png');

  const sections = [
    { text: 'Company', file: 'settings-02-company' },
    { text: 'Security', file: 'settings-03-security' },
    { text: 'Preferences', file: 'settings-04-preferences-top' },
    { text: 'Offline', file: 'settings-05-offline-data' },
    { text: 'Companies', file: 'settings-06-companies' },
    { text: 'Users', file: 'settings-07-users' },
    { text: 'Roles', file: 'settings-08-roles' },
    { text: 'Integrations', file: 'settings-09-integrations' },
    { text: 'Subscription', file: 'settings-10-subscription' },
    { text: 'System', file: 'settings-11-system' },
    { text: 'Sync', file: 'settings-12-sync-history' },
  ];

  for (const s of sections) {
    try {
      await page.click(`a:has-text("${s.text}"), button:has-text("${s.text}"), [role="tab"]:has-text("${s.text}")`, { timeout: 5000 });
      await page.waitForTimeout(1000);
      await shot(page, `${s.file}.png`);
    } catch {
      await waitForNav(page, `${BASE}/dashboard/settings`);
      await page.screenshot({ path: path.join(OUT, `${s.file}.png`) });
    }
  }

  // New company modal
  try {
    await page.click('a:has-text("Companies"), button:has-text("Companies")', { timeout: 4000 });
    await page.waitForTimeout(800);
    await page.click('button:has-text("New"), button:has-text("Add"), button:has-text("+")', { timeout: 4000 });
    await page.waitForTimeout(700);
    await shot(page, 'settings-06b-companies-new-modal.png');
    await page.keyboard.press('Escape');
    await clickIfExists(page, 'button:has-text("Cancel")', 2000);
  } catch { await page.screenshot({ path: path.join(OUT, 'settings-06b-companies-new-modal.png') }); }

  // Create user modal
  try {
    await page.click('a:has-text("Users"), button:has-text("Users")', { timeout: 4000 });
    await page.waitForTimeout(800);
    await page.click('button:has-text("Invite"), button:has-text("New User"), button:has-text("Create"), button:has-text("+")', { timeout: 4000 });
    await page.waitForTimeout(700);
    await shot(page, 'settings-07b-users-create-modal.png');
    await page.keyboard.press('Escape');
    await clickIfExists(page, 'button:has-text("Cancel")', 2000);
  } catch { await page.screenshot({ path: path.join(OUT, 'settings-07b-users-create-modal.png') }); }

  // Role modals
  try {
    await page.click('a:has-text("Roles"), button:has-text("Roles")', { timeout: 4000 });
    await page.waitForTimeout(800);

    // Create role modal
    try {
      await page.click('button:has-text("Create"), button:has-text("New Role"), button:has-text("+")', { timeout: 4000 });
      await page.waitForTimeout(700);
      await shot(page, 'settings-08b-roles-create-modal.png');
      await page.keyboard.press('Escape');
      await clickIfExists(page, 'button:has-text("Cancel")', 2000);
    } catch { await page.screenshot({ path: path.join(OUT, 'settings-08b-roles-create-modal.png') }); }

    // Actions menu
    try {
      await page.click('table tbody tr:first-child button[aria-label*="more" i], table tbody tr:first-child [data-testid*="actions"]', { timeout: 4000 });
      await page.waitForTimeout(500);
      await shot(page, 'settings-08c-roles-actions-menu.png');
      await page.keyboard.press('Escape');
    } catch { await page.screenshot({ path: path.join(OUT, 'settings-08c-roles-actions-menu.png') }); }

    // Edit general
    try {
      await page.click('table tbody tr:first-child button:has-text("Edit"), table tbody tr:first-child [aria-label*="edit" i]', { timeout: 4000 });
      await page.waitForTimeout(800);
      await shot(page, 'settings-08d-roles-edit-general.png');
      // Permissions tab
      try {
        await page.click('[role="tab"]:has-text("Permissions"), button:has-text("Permissions")', { timeout: 3000 });
        await page.waitForTimeout(600);
        await shot(page, 'settings-08e-roles-edit-permissions.png');
      } catch { await page.screenshot({ path: path.join(OUT, 'settings-08e-roles-edit-permissions.png') }); }
      await page.keyboard.press('Escape');
      await clickIfExists(page, 'button:has-text("Cancel")', 2000);
    } catch { await page.screenshot({ path: path.join(OUT, 'settings-08d-roles-edit-general.png') }); await page.screenshot({ path: path.join(OUT, 'settings-08e-roles-edit-permissions.png') }); }
  } catch { console.log('  ⚠ Roles section not available'); }
  console.log('  ✓ Settings done');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Flowentra Documentation Screenshot Capture');
  console.log(`   Target: ${BASE}`);
  console.log(`   Output: ${OUT}\n`);

  const browser = await chromium.launch({
    headless: false, // visible so you can watch progress
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  // Suppress tour/onboarding flags upfront
  await context.addInitScript(() => {
    localStorage.setItem('tour-completed', 'true');
    localStorage.setItem('onboarding-completed', 'true');
  });

  const page = await context.newPage();

  // Silence console errors from the app
  page.on('console', () => {});
  page.on('pageerror', () => {});

  try {
    await login(page);
    await captureDashboard(page);
    await captureContacts(page);
    await captureArticles(page);
    await captureStock(page);
    await capturePurchases(page);
    await captureServiceOrders(page);
    await captureHR(page);
    await captureDynamicForms(page);
    await captureWorkflow(page);
    await captureExternal(page);
    await captureLookups(page);
    await captureScheduling(page);
    await captureSettings(page);

    const count = fs.readdirSync(OUT).filter(f => f.endsWith('.png')).length;
    console.log(`\n✅ Done! ${count} screenshots saved to public/docs-screenshots/`);
    console.log('\nNext step: node scripts/generate-docs-pdf.mjs');
  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);

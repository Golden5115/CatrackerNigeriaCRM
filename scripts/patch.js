const fs = require('fs');
const files = [
  'c:/src/car-tracking-crm/app/dashboard/vehicles/page.tsx',
  'c:/src/car-tracking-crm/app/dashboard/tech/page.tsx',
  'c:/src/car-tracking-crm/app/dashboard/activation/page.tsx',
  'c:/src/car-tracking-crm/app/dashboard/payments/page.tsx',
  'c:/src/car-tracking-crm/app/dashboard/revenue/page.tsx',
  'c:/src/car-tracking-crm/app/actions/accounts.ts'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // For Job findMany
    content = content.replace(/prisma\.job\.findMany\(\s*\{\s*where:\s*\{/g, 'prisma.job.findMany({ where: { isArchived: false, ');
    // For Vehicle findMany
    content = content.replace(/prisma\.vehicle\.findMany\(\s*\{\s*where:\s*\{/g, 'prisma.vehicle.findMany({ where: { isArchived: false, ');
    fs.writeFileSync(file, content);
  }
}
console.log('Patch complete.');

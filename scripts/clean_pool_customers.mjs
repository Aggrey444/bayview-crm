import fs from 'fs';

const content = fs.readFileSync('pool_data.csv', 'utf8');
const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

function cleanName(raw) {
  if (!raw || !raw.trim()) return 'Pool Guest';
  let n = raw.trim();
  if (n.toLowerCase() === 'ayisha') return 'Ayisha';
  if (n === n.toUpperCase() && n.length > 2) {
    n = n.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }
  return n;
}

function cleanPhone(raw) {
  if (!raw) return null;
  let digits = raw.trim().replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('233')) {
    return '0' + digits.slice(3);
  }
  if (!digits.startsWith('0')) {
    return '0' + digits;
  }
  return digits;
}

function cleanAddress(raw) {
  if (!raw || !raw.trim()) return null;
  return raw.trim();
}

const cleaned = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  const parts = line.split(',');
  const rawName = parts[0];
  const rawPhone = parts[1];
  const rawAddress = parts.slice(2).join(',');

  const name = cleanName(rawName);
  const phone = cleanPhone(rawPhone);
  const address = cleanAddress(rawAddress);

  cleaned.push({
    name,
    phone,
    address,
    notes: 'Customer registered from Pool Side records',
  });
}

console.log(`Total cleaned customers: ${cleaned.length}`);

fs.writeFileSync('prisma/data/pool_customers.json', JSON.stringify(cleaned, null, 2), 'utf8');
console.log('Saved to prisma/data/pool_customers.json');

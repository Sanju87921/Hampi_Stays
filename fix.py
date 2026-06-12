import re

with open('backend/server/worker.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the overlap logic
old_overlap = r'const hasOverlap = existingBookings\.some\(b => \{.*?\n\s+return c\.json\(\{ error: \'Time slot overlaps with an existing booking\' \}, 400\);\n\s+\}\);?'
new_overlap = '''const totalBookedHours = existingBookings.reduce((sum, b) => {
      const bDate = new Date(b.date);
      if (bDate.getFullYear() === bookingDate.getFullYear() && 
          bDate.getMonth() === bookingDate.getMonth() && 
          bDate.getDate() === bookingDate.getDate()) {
        return sum + b.durationHours;
      }
      return sum;
    }, 0);
    
    if (totalBookedHours + durationHours > 8) {
      return c.json({ error: 'Guide does not have enough hours available on this date' }, 400);
    }'''

content = re.sub(old_overlap, new_overlap, content, flags=re.DOTALL)

with open('backend/server/worker.js', 'w', encoding='utf-8') as f:
    f.write(content)

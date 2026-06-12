with open('backend/server/worker.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_str = """    const hasOverlap = existingBookings.some(b => {
      const existingStart = new Date(b.date);
      const existingEnd = new Date(existingStart.getTime() + b.durationHours * 60 * 60 * 1000);
      return (bookingDate < existingEnd && bookingEnd > existingStart);
    });
    
    if (hasOverlap) {
      return c.json({ error: 'Time slot overlaps with an existing booking' }, 400);
    }"""

new_str = """    const totalBookedHours = existingBookings.reduce((sum, b) => {
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
    }"""

content = content.replace(old_str, new_str)
content = content.replace("specialRequests,\n        status: 'PENDING'", "specialRequests: specialRequests || null,\n        status: 'PENDING'")
content = content.replace("specialRequests,\r\n        status: 'PENDING'", "specialRequests: specialRequests || null,\r\n        status: 'PENDING'")

with open('backend/server/worker.js', 'w', encoding='utf-8') as f:
    f.write(content)

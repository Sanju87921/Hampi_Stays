with open('backend/server/worker.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "const hasOverlap = existingBookings.some(b => {" in line:
        skip = True
        new_lines.append("    const totalBookedHours = existingBookings.reduce((sum, b) => {\n")
        new_lines.append("      const bDate = new Date(b.date);\n")
        new_lines.append("      if (bDate.getFullYear() === bookingDate.getFullYear() && bDate.getMonth() === bookingDate.getMonth() && bDate.getDate() === bookingDate.getDate()) {\n")
        new_lines.append("        return sum + b.durationHours;\n")
        new_lines.append("      }\n")
        new_lines.append("      return sum;\n")
        new_lines.append("    }, 0);\n")
        new_lines.append("\n")
        new_lines.append("    if (totalBookedHours + durationHours > 8) {\n")
        new_lines.append("      return c.json({ error: 'Guide does not have enough hours available on this date' }, 400);\n")
        new_lines.append("    }\n")
        continue

    if skip:
        if "return c.json({ error: 'Time slot overlaps with an existing booking' }, 400);" in line:
            skip_next = True
        elif skip_next and "}" in line:
            skip = False
            skip_next = False
        continue

    if "specialRequests," in line and "status: 'PENDING'" in lines[i+1]:
        new_lines.append("        specialRequests: specialRequests || null,\n")
    else:
        new_lines.append(line)

with open('backend/server/worker.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

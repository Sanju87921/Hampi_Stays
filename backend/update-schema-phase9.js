import fs from 'fs';

const schemaPath = 'prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

const blogModel = \`
model BlogPost {
  id              String   @id @default(cuid())
  slug            String   @unique
  title           String
  content         String   @db.Text
  excerpt         String?
  featuredImage   String?
  authorId        String
  categoryId      String?
  publishedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  metaTitle       String?
  metaDescription String?
  isFeatured      Boolean  @default(false)
  tags            String[] @default([])

  author          User     @relation("BlogAuthor", fields: [authorId], references: [id])

  @@index([slug])
  @@index([publishedAt])
  @@map("blog_posts")
}
\`;

if (!schema.includes('model BlogPost')) {
  schema += blogModel;

  const userModelRegex = new RegExp(\`model User \\\{[\\\\s\\\\S]*?\\\n\\\}\`);
  const match = schema.match(userModelRegex);
  if (match && !match[0].includes('blogPosts')) {
    const endBraceIndex = match[0].lastIndexOf('}');
    const newModelBody = match[0].slice(0, endBraceIndex) + '  blogPosts        BlogPost[]         @relation("BlogAuthor")\n' + match[0].slice(endBraceIndex);
    schema = schema.replace(match[0], newModelBody);
  }

  fs.writeFileSync(schemaPath, schema);
  console.log('Blog schema added successfully!');
}

FROM node:20-alpine

# ✅ เพิ่มบรรทัดนี้: ติดตั้งเครื่องมือที่ Prisma จำเป็นต้องใช้ใน Alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# ✅ เจนเนอเรต Prisma Client อีกรอบเพื่อให้แน่ใจว่าเข้ากับ Alpine
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "start"]
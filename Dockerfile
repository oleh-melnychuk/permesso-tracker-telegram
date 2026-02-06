FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --production

# Copy source code
COPY src/ ./src/

# Run the bot
CMD ["node", "src/bot.js"]

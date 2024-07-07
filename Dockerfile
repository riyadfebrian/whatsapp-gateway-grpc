FROM node:22.4.0-alpine

RUN apk add --no-cache \
chromium \
nss \
freetype \
harfbuzz \
ca-certificates \
ttf-freefont \
wqy-zenhei

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium-browser


WORKDIR /app

COPY package*.json ./

RUN npm install


# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 50055

# Command to run the app
CMD ["node", "app.js"]
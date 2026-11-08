# API image. Build from the repository root:
#   docker build -t vestpayouts-api .
# The Next.js app deploys to Netlify (see apps/web/netlify.toml) and is not part of this image.
FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json yarn.lock ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
# Install only what the API needs at runtime: drop the web workspace and the
# root dev tools (Supabase CLI, concurrently) from the workspace manifest, then
# install production dependencies. --pure-lockfile keeps the locked versions
# without failing on the entries that only the website uses.
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.workspaces=['apps/api','packages/shared'];delete p.devDependencies;fs.writeFileSync('package.json',JSON.stringify(p,null,2));" \
  && yarn install --production --pure-lockfile --non-interactive \
  && yarn cache clean
COPY packages/shared packages/shared
COPY apps/api apps/api
ENV NODE_ENV=production
ENV PORT=4318
EXPOSE 4318
CMD ["yarn", "workspace", "@vestpayouts/api", "start"]

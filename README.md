# Telegram OpenFreeMap Starter
The project is a simple template to start with if you want to integrate maps in your telegram mini app. It uses **react-maplibre-gl** as a framework to integrate **OpenFreeMap** tiles. Front-end app fetches directly from Supabase database.

## Features
- **React v.19**
- **Vite**
- **@telegram-apps/sdk-react**
- **maplibre-gl**
- **react-map-gl**
- **@supabase/supabase-js**
- **@preact/signals-react**
- **tailwindcss v.4**

- **docker-compose** setup

## Getting started 
Clone the project and install dependencies.
```
npm install
```
To run in development mode:
```
npm run dev
```
Set environment variables in **backend/.env**
```
# example .env file
PORT=3000
BOT_TOKEN=12345:yourtelegrambottoken
FRONTEND_URL=https://xxx.ngrok-free.app
ADMIN_USER_ID=123456789
AUTH_PASSWORD=strong-password
# to run script that populate supabase
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_your_supabase_project_secret
```

Set environment variables in **frontend/.env**
```
VITE_SUPABASE_URL=https://yourprojecturl.supabase.co
VITE_SUPABASE_ANON_KEY=supabase_anon_key
```

### Docker compose setup
1. Install docker compose 
2. Create Bot in telegram
3. Set env. variables
4. Start docker 
```
docker compose up -d --build
```
It will expose port **8080** so that you should use some service to expose you app, for example **Ngrok**. 
5. Set TMA webhook url and TMA button url with **BotFather** in telegram

### .sh script setup
1. Install **Ngrok**
2. run the script 
```
sudo chmod +x ./start-tma.sh
./start-tma.sh
```

### docker compose + cloudflared tunnel
1. Install **cloudflared** ([cloudflare-tunnel/downloads](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/))
```sh
sudo dpkg -i cloudflared-linux-amd64.deb
```

2. run **docker compose** and **cloudflared tunnel**
```sh
docker compose up -d 
cloudflared tunnel --url http://localhost:8080 
```
3. set **telegram mini app url**:
```
curl -sS -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "menu_button": {
    "type": "web_app",
    "text": "Open App",
    "web_app": {
      "url": "${PUBLIC_URL}"
    }
  }
}
```

### Overpass turbo
Project uses **Overpass turbo API** to fetch **OpenStreetMap** locations. Example test locations could be found in `backend/src/lib/test-locations.json`
The query used to call **Overpass API**:
```
[out:json][timeout:25];
(
  nwr["amenity"="bar"]["name"~"V.*"]({{bbox}});
);
out center tags;
```
You should send **POST** request to `https://overpass-api.de/api/interpreter`, encode body as `Form URL Encoded` and body key is `data`
Read more in [Overpass documentation](https://wiki.openstreetmap.org/wiki/Overpass_API/Language_Guide#Overpass_QL_Basics)

### Debugging
1. Stop running docker containers befor rerunning `./start-tma.sh`
```sh
docker container prune
```

2. When you add new depencencies make sure you run `npm install <dependency>` either from `frontend` or `backend` folder (not from the root).
If you use **docker compose** , make sure you removed **volumes** and recreate **images** and **containers** after installing new dependencies. 

```sh
docker compose down -v 
docker compose down --rmi all
# to check if the depency is installed in the running container
docker exec -it <conatiner name> npm ls <dependency name>
```

## Useful links
- [react-map-gl](https://github.com/visgl/react-map-gl)
- [OpenFreeMap](https://openfreemap.org/quick_start/)
- [bbox tool](https://norbertrenner.de/osm/bbox.html)
- [overpass-turbo](https://overpass-turbo.eu/)

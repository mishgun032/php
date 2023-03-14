import express from 'express'
const app = express()
import cors from 'cors'
const port = 8080
import fetch from 'node-fetch'
import bcrypt  from 'bcrypt';

import { createClient } from 'redis';
export const redis = createClient();
redis.on('error', err => console.log('Redis Client Error', err));
await redis.connect();

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

import { isLoggedIn, login, revalidateToken} from "./auth.js"

app.use(cors())

class Cache {
  constructor(){
    this.expiraction = 43200000 //12h in ms 
    this.anime = {
      apiKey : "97f19bb6ca11e00d2031a0258794dc52"
    };
    this.nyt = {
      apiKey:'y9pg09oq37Vdf5NP9DesBC7KeT368izV'
    };
    this.todo = {};
    this.github = {};
    this.err = {};
  }

  //all the getters
  async getSeasonalAnime(year= new Date().getFullYear(),season= seasons[Math.round((new Date().getMonth()+1)/4)],offset=0,limit=10){
    return;
    if(this.err.anime){
      await this.updateAnimeSeasonal(year,season,offset);
      if(this.err.anime) return {message: "could not get anime "}
    };
    if(this.anime[year]) {
      if(this.anime[year][season]) {
	if(this.anime[year][season][offset]) {
	  if ((Date.now() - this.anime[year][season][offset].timestamp) <= this.expiraction){
	    return this.anime[year][season][offset]
	  }
	}
      }
    }
    await this.updateAnimeSeasonal(year,season,offset)
    return await this.getSeasonalAnime(year,season,offset,limit)
  }
  async getTopAnime(){

  }
  async getNytTopStories(section="home"){
    if(this.err.nyt){
      await this.updateNytTopStories(section)
      if(this.err.nyt) return {error: "could not get any articles"};
    };
    if (this.nyt.topStories){
      if (this.nyt.topStories[section]){
	if( ((Date.now() - this.topStories[section].timestamp) <= this.expiraction)){
	  return this.nyt.topStories[section]
	}
      }
    }
    await this.updateNytTopStories(section)
  }
  async getNytPopular(){

  }
  async getNytTop(type="top",section="home"){
//    if(this.nyt.topStories[section]
    await this.updateNytTopStories(section)
  }
  getGithub(){

  }
  getTodo(){

  }

  //populating  
  async update(){

  }
  async updateAnimeSeasonal(year= new Date().getFullYear(),season= seasons[Math.round((new Date().getMonth()+1)/4)],offset=0,limit=10){
    console.log('fetching anime')
    try{
      const req = await fetch(`https://api.myanimelist.net/v2/anime/season/${year}/${season}?offset=${offset}&limit=${limit}&raiting&studios&source&num_episodes&genres&status&mean&synopsis`,{
	method:"GET",
	headers: {
	  'X-MAL-CLIENT-ID': this.anime.apiKey
	}
      })
      const anime = await req.json()
      anime.timestamp = Date.now()
      if(!this.anime[year]) this.anime[year] = {}
      if(!this.anime[year][season]) this.anime[year][season] = {}
      this.anime[year][season][offset] = anime
      if(this.err.anime)delete this.err.anime
    }catch(err){
      this.err.anime = err
    }
  }
  async updateAnimeRanking(type,offset,limit){
    console.log('anime')
    try{
      const req = await fetch(`https://api.myanimelist.net/v2/anime/ranking?ranking_type=${type}&limit=${limit}&offset=${offset}`,{
	method:"GET",
	headers: {
	  'X-MAL-CLIENT-ID': this.anime.apiKey
	}
      })
    }catch(err){
      this.err.ranking = err
    }
  }
  async updateNytPopular(period){
    const req = await fetch(`https://api.nytimes.com/svc/mostpopular/v2/viewed/${period}.json?api-key=${this.nyt.apiKey}`)
    const articles = req.json()
    articles.timestamp = Date.now()
    this.nyt.popular = articles
  }
  async updateNytTopStories(section="home"){
    const req = await fetch(`https://api.nytimes.com/svc/topstories/v2/${section}.json?api-key=${this.nyt.apiKey}`)
    const articles = req.json()
    articles.timestamp = date.now()
    if(!this.nyt.topStories) this.nyt.topStories = {}
    this.nyt.topStories[section] = articles
  }

  async updateGithub(){

  }
  async updateTodo(){

  }
}

const seasons = ["winter","spring","summer","fall"]
const cache = new Cache()

app.use(isLoggedIn.unless({
  path: ["/login","/","/createuser","/token","/api/mal/seasonal"],
  
}));
app.use(express.json())

app.get("/", (req,res) => {res.redirect("https://www.youtube.com/watch?v=dQw4w9WgXcQ")})

app.post("/createuser", async (req,res) => {
  if (!req.body.user_name) return res.status(400).end()
  if (!req.body.password) return res.status(400).end()
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(req.body.password, salt, async function(err, hash) {
      if(err){console.log(err); return res.send({error: "somehitng went wrong"})}
      try{
        const user = await prisma.users.create({ data: {name: req.body.user_name,password: hash}})
        return res.send(JSON.stringify({message: "user added",user:user}))
      } catch (err) { console.log(err); return res.send(JSON.stringify({error: "something went wrong"})) }
    });
  });
})

app.post("/login", async (req,res) => {
  if (!req.body.user_name) return  res.status(400).end()
  if (!req.body.password) return res.status(400).end()
  try{
    const user = await prisma.users.findUnique({where: {name: req.body.user_name}})
    console.log(user)
    bcrypt.compare(req.body.password, user.password, async (err, result) => {
      if(err){console.log(err); return res.send({error: "somehitng went wrong"})}
      if(!result){return res.send(JSON.stringify({error: "invalid password"}))}
      const {token,refresh_token} = await login(user.name,user.id)
      if(!token || !refresh_token) return res.json({error: "could not log you in"})
      console.log(token)
      console.log(refresh_token)
      return res.json({message: "you are logged in",token: token,refresh_token: refresh_token})
    });
  } catch (err) { console.log(err); return res.send(JSON.stringify({error:"something went wrong"}))}
})

app.post("/logout", async (req,res) => {
 
})

app.post("/token", async (req,res) => {
  if(!req.body.token){return res.json({error: "invalid token"})}
  try{
    const isTokenValid = await redis.EXISTS(req.body.token)
    if(isTokenValid <= 0){return res.json({error: "invalid token"})}
    const token = await revalidateToken(req.body.token)
    console.log('token')
    console.log(token)
    res.json({message: "refreshed access token", token: token})
  }catch(err){
    console.log(err)
    return res.json({error: "could not check your token"})
  }
})

app.post("/addtodoitem", async (req,res) => {
  console.log('here')
  const {title,categories,description} = req.body
  if(!title) return res.json({error: "invalid item"});
  if(description){if(!Array.isArray(description)) return res.json({error: "invalid description"})};
  try{
    console.log(res.locals)
    console.log({owner: {id: res.locals.id},name: title, user_id: res.locals.id})
    const todo_item= await prisma.todo_items.create({ data: {name: title, user_id: res.locals.id}})
    return res.json({message: "item added", todo_item: todo_item})
  }catch(err){
    console.log(err)
    res.json("something went wrong")
  }
})

app.get('/api/mal/raking', async (req,res) => {
  try{
    const limit = req.query.limit
    const offset = req.query.offset
    const year = req.query.year
    const season = req.query.season
    if (limit && isNaN(limit)) return res.status(401).send("invalid limit")
    if(isNaN(offset)) return res.status(401).send("invalid offset")
    if (seasons.indexOf(season) == -1) return res.status(401).send("invalid season")
    return res.send(await cache.getAnime(year,season,offset,limit))
  }catch(err){
    console.log(err)
    res.json({error: "something went wrong"})
  }
})

app.get('/api/mal/seasonal', async (req,res) => {
  const limit = req.query.limit
  const offset = req.query.offset
  const year = req.query.year
  const season = req.query.season
  if (limit && isNaN(limit)) return res.status(401).send("invalid limit")
  if(isNaN(offset)) return res.status(401).send("invalid offset")
  if (seasons.indexOf(season) == -1) return res.status(401).send("invalid season")
  res.send(await cache.getSeasonalAnime(year,season,offset,limit))
})

app.get("api/nyt", async(req,res) => {

})

app.get('*', function(req, res){
  res.status(404).send('route not found ???');
});
app.post('*', function(req, res){
  res.status(404).send('route not found ???');
});

app.listen( port, () => {
//  setInterval( () => cache.update(), 7200000)
  cache.update()
  console.log(`running on port ${port}`)
})

app.use((err, req, res, next) => {
  console.log(err)
  if (err.message && err.message.code === 'ETIMEDOUT') { return res.send(JSON.stringify({ error: "server could not respond pleasy try letter" }))}
  console.log(req.url)
  console.log('sadf')
  return res.status(isNaN(err) ? "500" : err).send(JSON.stringify({error: "Something went wrong"}))
})


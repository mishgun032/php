import https from "https"
import fs from "fs"
import {COOKIE_LIFE_TIME} from './constants.js'
const options = {
  key: fs.readFileSync('./localhost-key.pem'),
  cert: fs.readFileSync('./localhost.pem'),
};

import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import bcrypt  from 'bcrypt';
import cookieParser from 'cookie-parser'
import { PrismaClient } from '@prisma/client'
import { createClient } from 'redis';


const port = 3001
const app = express()

export const redis = createClient();
redis.on('error', err => console.log('Redis Client Error', err));
await redis.connect();

const prisma = new PrismaClient({log: ["query"]})

import { isLoggedIn, login, revalidateToken} from "./auth.js"


app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: "Set-Cookie",
  methods: "GET,POST",
}))
app.use(cookieParser())
app.use(isLoggedIn.unless({
  path: ["/login","/","/createuser","/api/mal/seasonal","/token"],
}));
app.use(express.json())

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
  //populating  
  async update(){

  }
  async updateAnimeSeasonal(year= new Date().getFullYear(),season= seasons[Math.round((new Date().getMonth()+1)/4)],offset=0,limit=10){
    console.log('fetching anime')
    try{
      const req = await fetch(`https://api.myanimelist.net/v2/anime/season/${year}/${season}?offset=${offset}&limit=${limit}&fields=raiting,studios,source,num_episodes,genres,status,mean,synopsis`,{
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

app.get("/", (req,res) => res.redirect("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))

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

app.post("/getusers", async (req,res) => {
  const {input} = req.body
  if(input.length == 0 || input == undefined) return res.json({error: "invalid input"})
  try{
    const users = await prisma.users.findMany({where: { name: {contains: input}}})
    console.log(users)
    res.json({message: "all the users that match the given name", users: users})
  }catch(err){
    console.log(err)
    res.json({error: "something went wrong"})
  }
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
      res.cookie("access_token",token, { maxAge: COOKIE_LIFE_TIME, httpOnly: true, secure: true, sameSite: "none",expires: new Date(Date.now() + COOKIE_LIFE_TIME) })
      return res.json({message: "you are logged in",refresh_token: refresh_token})
    });
  } catch (err) { console.log(err); return res.send(JSON.stringify({error:"something went wrong"}))}
})

app.post("/logout", async (req,res) => {
 
})

app.post("/token", async (req,res) => {
  if(!req.body.refresh_token){return res.json({error: "invalid token"})}
  try{
    const isTokenValid = await redis.EXISTS(req.body.refresh_token)
    if(isTokenValid <= 0){return res.json({error: "invalid token"})}
    const userData= await redis.HGETALL(req.body.refresh_token)
    const token = await revalidateToken(req.body.refresh_token,userData)
    console.log('token')
    console.log(token)
    res.cookie("access_token",token, { maxAge: COOKIE_LIFE_TIME, httpOnly: true, secure: true, sameSite: "none",expires: new Date(Date.now() + COOKIE_LIFE_TIME) })
    res.json({message: "refreshed access token"})
  }catch(err){
    console.log(err)
    return res.json({error: "could not revalidate your token"})
  }
})


app.get("/gettodoitems", async (req,res) => {
  try{
    const todo_items = await prisma.todo_items.findMany({
      where: {user_id: +res.locals.id},
      select: {
        id: true,
        name: true,
        desc: true,
        category_items: {
          select: {category_id: true}
        }
      },
      orderBy: {id: "desc"}
    })
    console.log(todo_items)
    res.json({message: "successfully found your todo items", todo_items: todo_items})
  }catch(err){
    console.log(err)
    res.json({error: "could not get your todo items"})
  }
})

app.post("/addtodoitem", async (req,res) => {
  const {title,category_id,description} = req.body
  if(!title) return res.json({error: "invalid item"});
  if(description){if(!Array.isArray(description)) return res.json({error: "invalid description"})};
  let category_items = {}
  if(category_id && !isNaN(category_id)){category_items.create={};category_items.create.category_id=category_id}
  try{
    const todo_item= await prisma.todo_items.create({ data: {name: title, user_id: +res.locals.id,category_items}})
    return res.json({message: "item added", todo_item: todo_item})
  }catch(err){
    console.log(err)
    res.json("something went wrong")
  }
})

app.post("/addtodoitems", async (req,res) => {
 
})

app.post("/changetodoitem", async (req,res) => {
  const {title,description,id} = req.body
  const data = {}
  if(!id || isNaN(id)) return res.json({error: "invalid todo item"})
  if(title) data.name = title
  if(description && Array.isArray(description)) data.desc = description
  if(Object.keys(data).length === 0) res.json({error: "nothing to update"})
//  if(cate
  try{
    const result = await prisma.todo_items.updateMany({
      data:data,
      where: { user_id: +res.locals.id, id: id }
    })
    console.log(result)
    res.json({message: "changed your item"})
  }catch(err){
    console.log(err)
    res.json({error: "something went wrong"})
  }
})

app.post("/deletetodoitem", async (req,res) => {
  console.log('here')
  const {id} = req.body
  if(!id || isNaN(id)) return res.json({error: "invalid todo item"})
  try{
    const result = await prisma.todo_items.deleteMany({where: {user_id: +res.locals.id, id:+id}})
    console.log(result)
    res.json({message: "item delted"})
  }catch(err){
    console.log(err)
    res.json({error: 'could not delete the doto item from the server'})
  }
})

app.post("/addtodocategory", async (req,res) => {
  const {category_name,description} = req.body
  if(!category_name){ return res.json({error: "invalid category"})}
  const data = {
    name: req.body.category_name,
    user_id: +res.locals.id
  }
  description.length != 0 ? data.desc = description : null;
  try{
    const category = await prisma.todo_categories.create({ data: data})
    return res.json({message: "category added", category: category})
  }catch(err){
    console.log(err)
    return res.json({error: "could not add the category"})
  }
})

app.post("/deletecategory", async (req,res) => {
  const {id} = req.body
  if(!id || isNaN(id)) res.json({error: "invalid category"})
  try{
    const result = await prisma.todo_categories.deleteMany({ where: {user_id: +res.locals.id, id: +id}})
    console.log(result)
    res.json({message: "category removed"})
  }catch(err){
    console.log(err)
    res.json({error: "something went wrong"})
  }
})

app.post("/addcategorytoitem", async (req,res) => {
  const {category_id,item_id} = req.body
  if((isNaN(category_id) || !category_id) || (isNaN(item_id) || !item_id)) return res.json({error: 'invalid data'})
  const ctgOwner = await prisma.todo_categories.findMany({where: {id: category_id,user_id: +res.locals.id}})
  if(ctgOwner){
    const sharedCtg = await prisma.categories_shared.findMany({where: {user_id: +res.locals.id, category_id: category_id}})
    if(!sharedCtg) return res.json({error: "you cannot add item to this category"})
  }
  const itemOwner = await prisma.todo_items.findMany({ where: {id: item_id, user_id: +res.locals.id}})
  if(!itemOwner) return res.json({error: "you cannot add this item"})
  const result = await prisma.category_items.create({ data: {item_id: item_id,category_id: category_id}})
  res.json({message: "category added"})
})

app.post("/removecategoryfromitem", async (req,res) => {
  
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

//app.listen( port, () => {
////  setInterval( () => cache.update(), 7200000)
//  cache.update()
//  console.log(`running on port ${port}`)
//})

app.use((err, req, res, next) => {
  console.log(err)
  if (err.message && err.message.code === 'ETIMEDOUT') { return res.send(JSON.stringify({ error: "server could not respond pleasy try letter" }))}
  console.log(req.url)
  console.log('sadf')
  return res.status(isNaN(err) ? "500" : err).send(JSON.stringify({error: "Something went wrong"}))
})


https.createServer(options,app).listen(port, () => {
  console.log(`running on port ${port}`)
})

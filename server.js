import express from 'express'
const app = express()
import cors from 'cors'
const port = 8080
import fetch from 'node-fetch'

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
  async getAnime(year= new Date().getFullYear(),season= seasons[Math.round((new Date().getMonth()+1)/4)],offset=0,limit=10){
    if(!this.anime[year]) await this.updateAnimeSeasonal(year,season,offset)
    if(!this.anime[year][season]) await this.updateAnimeSeasonal(year,season,offset)
    if(!this.anime[year][season][offset]) await this.updateAnimeSeasonal(year,season,offset)
    if ((Date.now() - this.anime[year][season][offset].timestamp) >= this.expiraction) await this.updateAnimeSeasonal(year,season,offset,limit)
    if(this.err.anime){
      await this.updateAnimeSeasonal();
      if(this.err.anime) return {message: "could not get anime "}
    };
    return this.anime[year][season][offset]
  }
  async getNytTopStories(section="home"){
    if (!this.nyt.topStories[section]) await this.updateNytTopStories(section)
    if( ((Date.now() - this.topStories[section].timestamp) >= this.expiraction)) await this.updateNytTopStories(section)
    return this.nyt.topStories[section]
  }
  async getNytPopular(){

  }
  getGithub(){

  }
  getTodo(){

  }

  //populating  
  async update(){
//    await this.updateAnimeSeasonal()
    await this.updateNyt()
    await this.updateGithub()
    await this.updateTodo()
    
  }
  async updateAnimeSeasonal(year= new Date().getFullYear(),season= seasons[Math.round((new Date().getMonth()+1)/4)],offset=0,limit=10){
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
  async updateNyt(period){
    return;
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

app.get("/", (req,res) => {
  console.log(req.params)
  res.send(req.params.session ? req.params.session : "k")
})
app.get('/api/mal/raking', async (req,res) => {
  const limit = req.query.limit
  const offset = req.query.offset
  const year = req.query.year
  const season = req.query.season
  if (limit && isNaN(limit)) return res.status(401).send("invalid limit")
  if(isNaN(offset)) return res.status(401).send("invalid offset")
  if (seasons.indexOf(season) == -1) return res.status(401).send("invalid season")
  res.send(await cache.getAnime(year,season,offset,limit))
})

app.get('/api/mal/seasonal', async (req,res) => {
  const limit = req.query.limit
  const offset = req.query.offset
  const year = req.query.year
  const season = req.query.season
  if (limit && isNaN(limit)) return res.status(401).send("invalid limit")
  if(isNaN(offset)) return res.status(401).send("invalid offset")
  if (seasons.indexOf(season) == -1) return res.status(401).send("invalid season")
  res.send(await cache.getAnime(year,season,offset,limit))
})
app.get("api/nyt", async(req,res) => {

})

app.listen( port, () => {
//  setInterval( () => cache.update(), 7200000)
  cache.update()
  console.log(`running on port ${port}`)
})

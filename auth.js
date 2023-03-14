import {unless} from 'express-unless'
import jwt from 'jsonwebtoken'
import {redis} from './server.js'

export const isLoggedIn = (req,res,next) => {
  if(!req.headers.token){res.locals.logged_in = false; return next(401)}
  jwt.verify(req.headers.token, process.env.ACCESS_TOKEN_SECRET, (err,usr) => {
    if(err){console.log(err); return next(403)};
    console.log('usr')
    console.log(usr)
    res.locals.logged_in = true
    res.locals.id = usr.user_id
    res.locals.name = usr.user_name
    next()
  })
}
isLoggedIn.unless = unless

export async function login(name,id){
  if(!name) throw new Err("invalid user name");
  if(!id) throw new Err("invalid user id");

  const token = generateAccessToken(name,id)
  const refresh_token = jwt.sign({},process.env.REFRESH_TOKEN_SECRET)
  await redis.HSET(refresh_token, "user_id", id)
  await redis.HSET(refresh_token, "user_name", name)
  return {token,refresh_token}
}

export function generateAccessToken(name,id){
  if(!name) throw new Err("invalid user name");
  if(!id) throw new Err("invalid user id");

  return jwt.sign({
    user_id: id,
    user_name: name,
  },process.env.ACCESS_TOKEN_SECRET,{expiresIn: "10h"})
}

export function revalidateToken(refreshToken){
  return new Promise( (resolve,reject) => {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err,user) => {
      if(err){console.log(err); return reject("could not revalidate your token");}
      return resolve(generateAccessToken(user.user_name,user.user_id))
    })
  })
}

export function logout(){
  
}


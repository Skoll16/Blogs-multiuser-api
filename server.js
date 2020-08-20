const express=require('express')
const morgan=require('morgan')
const bodyParser=require('body-parser')
const cookieParser=require('cookie-parser')
const cors=require('cors')
const mongoose=require('mongoose')
require('dotenv').config()

// routees
const blogRoutes=require('./Routes/Blog')
const authRoutes=require('./Routes/Auth')
const userRoutes=require('./Routes/User')
const categoryRoutes=require('./Routes/Category')
const tagRoute=require('./Routes/Tag')
const formRoute=require('./Routes/Form')

// app
const app = express()

// Middlewares
app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(cookieParser())

// db
mongoose.connect(process.env.DB,{useNewUrlParser:true}).then(()=>{console.log('Hosted')}).
catch((err)=>{
    console.log(err);
})

// cors 
if(process.env.NODE_ENV==='development'){
    app.use(cors({origin:`${process.env.CLIENT_URL}`}));
}

// routes middleware
app.use('/api',blogRoutes);
app.use('/api',authRoutes)
app.use('/api',userRoutes)
app.use('/api',categoryRoutes)
app.use('/api',tagRoute)
app.use('/api',formRoute)

// port
const port=process.env.PORT || 8000
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
})    
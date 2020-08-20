const Blog = require("../Models/blog");
const Category = require("../models/category");
const Tag = require("../Models/tag");
const User = require("../Models/user");
const { smartTrim } = require("../helpers/blogs");
const formidable = require("formidable");
const slugify = require("slugify");
const stripHtml = require("string-strip-html");
const fs = require("fs");
const _ = require("lodash");
// lodash to update the blog
const { errorHandler } = require("../helpers/dbErrorHandler");

exports.create = (req, res) => {
  // to get form data
  let form = formidable.IncomingForm();
  // to keep form extensions
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Image could not upload",
      });
    }
    const { title, body, categories, tags } = fields;
    if (!title || !title.length) {
      return res.status(400).json({
        error: "Title is required",
      });
    }

    if (!body || body.length < 200) {
      return res.status(400).json({
        error: "Content is too short, required minimum 200 words",
      });
    }

    if (!categories || categories.length === 0) {
      return res.status(400).json({
        error: "At least one category is required",
      });
    }

    if (!tags || tags.length === 0) {
      return res.status(400).json({
        error: "At least one tag is required",
      });
    }

    let blog = new Blog();
    blog.title = title;
    blog.body = body;
    blog.excerpt = smartTrim(body, 320, " ", "...");
    blog.slug = slugify(title).toLowerCase();
    blog.mtitle = `${title}|${process.env.APP_NAME}`;
    blog.mdesc = stripHtml(body.substring(0, 160));
    blog.postedBy = req.user._id;

    // categories and tags
    let arrayOfCategories = categories && categories.split(",");
    let arrayOfTags = tags && tags.split(",");

    if (files.photo) {
      if (files.photo.size > 10000000) {
        return res.status(400).json({
          error: "Image should be less tha 1 MB in size",
        });
      }
      // fs is the file system and give access to files
      blog.photo.data = fs.readFileSync(files.photo.path);
      blog.photo.contentType = files.photo.type;
    }
    blog.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      // res.json(result)
      // push is used to apend and also new true will return update result
      Blog.findByIdAndUpdate(
        result._id,
        { $push: { categories: arrayOfCategories } },
        { new: true }
      ).exec((err, result) => {
        if (err) {
          return res.status(400).json({
            erro: errorHandler(err),
          });
        } else {
          Blog.findByIdAndUpdate(
            result._id,
            { $push: { tags: arrayOfTags } },
            { new: true }
          ).exec((err, result) => {
            if (err) {
              return res.status(400).json({
                erro: errorHandler(err),
              });
            } else {
              return res.json(result);
            }
          });
        }
      });
    });

    // blog.categories=categories
    // blog.tags=tags
  });
};

exports.list = (req, res) => {
  Blog.find({})
    .populate("categories", "_id name slug")
    .populate("tags", "_id name slug")
    .populate("postedBy", "_id name username")
    .select(
      "_id title slug excerpt categories tags postedBy createdAt updatedAt"
    )
    .exec((err, data) => {
      if (err) {
        return res.json({
          error: errorHandler(err),
        });
      }
      return res.json(data);
    });
};

exports.listAllBlogsCategoriesTags = (req, res) => {
  const limit = req.body.limit ? parseInt(req.body.limit) : 10;
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;

  let blogs
  let categories
  let tags

  Blog.find({})
    .populate('categories', '_id name slug')
    .populate('tags', '_id name slug')
    .populate('postedBy', '_id name username profile')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select(
      '_id title slug excerpt categories tags postedBy createdAt updatedAt'
    )
    .exec((err, data) => {
      if (err) {
        return res.json({
          error: errorHandler(err),
        });
      }
      // all blogs
      blogs = data;
      // all categories
      Category.find({}).exec((err, c) => {
        if (err) {
          return res.json({
            error: errorHandler(err),
          });
        }
        categories = c;

        // all tags
        Tag.find({}).exec((err, t) => {
          if (err) {
            return res.json({
              error: errorHandler(err),
            });
          }
          tags = t;
          // return all blogs categories and tags
          res.json({ blogs, categories, tags, size: blogs.length });
        });
      });
    });
};

exports.read = (req, res) => {
  const slug = req.params.slug.toLowerCase();
  Blog.findOne({ slug })
  // .select("-photo") to send all item excepet this
  .populate("categories", "_id name slug")
    .populate("tags", "_id name slug")
    .populate("postedBy", "_id name username")
    .select(
      "_id title body mtitle mdesc slug excerpt categories tags postedBy createdAt updatedAt"
    )
    .exec((err, data) => {
      if (err) {
        return res.json({
          error: errorHandler(err),
        });
      }
      return res.json(data);
    });
};

exports.remove = (req, res) => {
  const slug = req.params.slug.toLowerCase();
  Blog.findOneAndRemove({ slug }).exec((err, data) => {
    if (err) {
      return res.json({
        error: errorHandler(err),
      });
    }
    res.json({
      message: "Blog deleted successfully",
    });
  });
};

exports.update = (req, res) => {
  const slug = req.params.slug.toLowerCase();

  Blog.findOne({ slug }).exec((err, oldBlog) => {
    if (err) {
      return res.json({
        error: errorHandler(err),
      });
    }

    // to get form data
    let form = formidable.IncomingForm();
    // to keep form extensions
    form.keepExtensions = true;

    form.parse(req, (err, fields, files) => {
      if (err) {
        return res.status(400).json({
          error: "Image could not upload",
        });
      }
  
  
      //  if user only want to update title or any particular thing
      //  then we need to update that part only for that we use loadsh ......use the slug of it

      let slugBeforeMerge = oldBlog.slug;

      oldBlog = _.merge(oldBlog, fields);
      oldBlog.slug = slugBeforeMerge;

      const {body,desc,categories,tags}=fields;
      if (body) {
        oldBlog.excerpt = smartTrim(body, 320, "", " ...");
        oldBlog.mdesc = stripHtml(body.substring(0, 100));
      }

      if (categories) {
        oldBlog.categories = categories.split(",");
      }
      if (tags) {
        oldBlog.tags = tags.split(",");
      }

      if (files.photo) {
        if (files.photo.size > 10000000) {
          return res.status(400).json({
            error: "Image should be less tha 1 MB in size",
          });
        }
        // fs is the file system and give access to files
        oldBlog.photo.data = fs.readFileSync(files.photo.path);
        oldBlog.photo.contentType = files.photo.type;
      }
      oldBlog.save((err, result) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err),
          });
        }
        result.photo=undefined;
        res.json(result)
      });
    });
  });
};

exports.photo=(req,res)=>{
  const slug=req.params.slug.toLowerCase()
  Blog.findOne({slug})
  .select('photo')
  .exec((err,blog)=>{
      if(err ||!blog){
  return res.status(400).json({
      error:errorHandler(err)
  })
      }
      res.set('Content-Type',blog.photo.contentType)
      return res.send(blog.photo.data)
  })
}



exports.listRelated=(req,res)=>{
  let limit=3
  
  const {_id,categories}=req.body.blog
  // down below ne is used to not include this blog basicall fetch all blogs with same categories excluding this one
  // also in is include this category and to find the other blogs based on this category
  Blog.find({_id:{$ne:_id},categories:{$in:categories}})
  .limit(limit)
  .populate('postedBy', '_id  username name profile')
  .select('title slug excerpt postedBy createdAt updatedAt')
  .exec((err,blog)=>{
   if(err){
     return res.status(400).json({
       error:'Blogs not found'
     })
   }
res.json(blog)

  })
}

exports.listSearch=(req,res)=>{
const {search}=req.query
if(search){
  Blog.find({
    $or:[{title:{$regex:search,$options:'i'}},{body:{$regex:search,$options:'i'}}]
    // blog will be search on the basis of title and 'i' for the case insesitive
  },(err,blogs)=>{
    if(err){
      return res.status(400).json({
        error:errorHandler(err)
      })
    }
    res.json(blogs)
  }).select('-photo -body');
}

}


exports.listByUser=(req,res)=>{
  User.findOne({username:req.params.username}).exec((err,user)=>{

    if(err){
      return res.status(400).json({
        error:errorHandler(err)
      })
    }
  
    let userId=user._id
    Blog.find({postedBy:userId})
    .populate('categories','_id name slug')
    .populate('tags','_id name slug')
    .populate('postedBy','_id name username')
    .select('_id title slug postedBy createdAt updatedAt')
    .exec((err,data)=>{
      
    if(err){
      return res.status(400).json({
        error:errorHandler(err)
      })
    }

    res.json(data)
    })


  })
}
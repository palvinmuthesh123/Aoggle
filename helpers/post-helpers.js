const client = require('../config/connection');
let objectId = require('mongodb').ObjectId;
const config = require('../config/config');
const collections = require("../config/collections");
const { response } = require('express');
var ffmpeg = require('ffmpeg');

// const escapeStringRegexp = require('escape-string-regexp');

module.exports = {
    doPost: (postData) => {
        return new Promise(async (resolve, reject) => {
            const postObject = JSON.parse(postData.userData);
            const locs = 
            { 
            type: 'Point', 
            coordinates: [ parseFloat(postData.currentLocation.coords.longitude), parseFloat(postData.currentLocation.coords.latitude) ] 
            }
            const postDetais = {
                postOwnerId: postObject._id,
                postOwnerName: postObject.username,
                time: postData.formattedDate,
                currentLocation: locs,
                videoData: postData.videoData.assets[0],
                permission: false
            }
            console.log(postObject, "OBJECT......................")
            console.log(postDetais, "DETAILS......................")
            await client.db(collections.DATABASE).collection(collections.POST_COLLECTION).insertOne(postDetais).then((response) => {
                if (response) {
                    resolve({ status: "success", id: `${response.insertedId}` });
                }
            }).catch((error) => {
                console.log(error)
                resolve({ status: "fail", message: "Something went wrong , Try again later" })
            })
        })
    },

    getPostBySearch : async (params) => {

        const latString = params.split(',')

        const latitude = parseFloat(latString[0].split(':')[1])
        const longitude = parseFloat(latString[1].split(':')[1]) 

        const results = await client.db(collections.DATABASE).collection(collections.POST_COLLECTION).find({}).toArray()

        return new Promise(async (resolve, reject) => {
                let arr = []
                for(var i = 0; i < results.length; i++)
                {   
                    if(results[i] && results[i].currentLocation)
                    {
                        var lat1 = results[i].currentLocation.coordinates[1]
                        var lon1 = results[i].currentLocation.coordinates[0]
                        var lat2 = latitude
                        var lon2 = longitude

                        var R = 6371;
                        var dLat = (lat2 - lat1) * (Math.PI / 180)
                        var dLon = (lon2 - lon1) * (Math.PI / 180)
                        var a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                        var d = R * c;
                        
                        if(parseInt(d)<=20)
                            {
                                arr.push(results[i]._id)
                            }
                    }
                }
                resolve(arr)
        })
    },

    getPosts: () => {
        return new Promise(async (resolve, reject) => {
            // try {
                const result = await client.db(collections.DATABASE).collection(collections.POST_COLLECTION).aggregate([
                    { $match: { permission: true } },
                    { $project: { id: { $toString: "$_id" } } }
                ]).toArray()

                for(var i = 0; i< result.length; i++)
                {
                    // var process = new ffmpeg(`https://d1fct0pxsc9git.cloudfront.net/public/${result[i].id}.mp4`, function (err, video) {
                    //         if (!err) {
                    //             console.log('The video is ready to be processed', video);
                    //         } else {
                    //             console.log('Error: ' + err);
                    //         }
                    // })

                    // var process = new ffmpeg(`https://d1fct0pxsc9git.cloudfront.net/public/${result[0].id}.mp4`);
                    // process.then(function (err, video) {
                    //         console.log('The video is ready to be processed',video);
                    //     }, function (err) {
                    //     console.log('Error: ' + err);
                    // });

                    console.log(result[i].id, "RRRRRRRRRRRRRRRRRR")
                }

                const ids = result.map(doc => doc.id);
                console.log("==============", result.length, result);
                resolve(ids)
            // } catch (error) {
            //     console.log(error)
            //     resolve({ status: "fail", message: "Something went wrong, Please try ahain later" })
            // }

        })
    },

    getProfilePosts: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const posts = await client.db(collections.DATABASE).collection(collections.POST_COLLECTION).aggregate([
                    { $match: { postOwnerId: userId , permission: true} },
                    { $project: { id: { $toString: "$_id" } } }
                ]).toArray()
                const ids = posts.map(doc => doc.id)

                const posts1 = await client.db(collections.DATABASE).collection(collections.POST_COLLECTION).aggregate([
                    { $match: { postOwnerId: userId , permission: false} },
                    { $project: { id: { $toString: "$_id" } } }
                ]).toArray()
                const ids1 = posts1.map(doc => doc.id)

                var videos = {
                    approved: ids,
                    unapproved: ids1
                }

                if(ids) {
                    resolve(videos)
                }
                } catch (error) {
                    resolve({status:'fail' , message:"Something went wrong"})
                }
        })
    }
}
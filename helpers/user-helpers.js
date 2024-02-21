const client = require('../config/connection');
const otpConfig = require('../config/otpconfig')
let objectId = require('mongodb').ObjectId
let bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const collections = require("../config/collections")
const AWS = require('aws-sdk');
const axios = require("axios");
const { ObjectId } = require('mongodb');

const OTP = require('twilio')(otpConfig.accountSID, otpConfig.authToken)

// AWS.config.update({
//     accessKeyId: 'AKIAUHXM2BYUGWUVFTNN',
//     secretAccessKey: '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'
// });

function generateOTP() {
    return Math.floor(Math.random() * 899999 + 100000)
}


// const s3 = new AWS.S3({ params: { Bucket: 'bucket_name' } })

module.exports = {
    doSignUp: (registerData) => {
        console.log("dosignup working", registerData)
        return new Promise(async (resolve, reject) => {
            const userExist = await client.db(collections.DATABASE).collection(collections.USER_COLLECTION).findOne({ mobileNumber: registerData.mobileNumber })
            if (userExist) {
                resolve({ status: "userExist", message: "This mobile number is already registered. Please try login" })
            }
            if (!userExist) {
                // let phonenumber = registerData.countryCode + registerData.mobileNumber
                let phonenumber = registerData.mobileNumber

                let otp = await generateOTP()

                axios.get(`https://fast2sms.com/dev/bulkV2?authorization=695MzQAfg0K2WdxoSHBcFpjNVeG4DtCZy1nEi8JUamXLurlIbYfCcJalGXTWxMP15L0zIrtVQD46K7O3&route=otp&variables_values=${otp}&flash=0&numbers=${phonenumber}`).then(async () => {

                // OTP.messages
                //     .create({
                //         body: `Your Verification OTP is ${otp}`,
                //         to: phonenumber, // Text your number
                //         from: '+18647321362', // From a valid Twilio number
                //     }).then((message, err) => {
                //         console.log(message, "MMMMMMMMMMM")
                //         console.log(err, "EEEEEEEEEEEEE")
                //     });

                const password = await bcrypt.hash(registerData.password, 10)
                const signUp = await client.db(collections.DATABASE).collection(collections.USER_COLLECTION).insertOne({
                    username: registerData.username,
                    mobileNumber: registerData.mobileNumber,
                    otp: otp,
                    posts: 0,
                    following: 0,
                    followers: 0,
                    password: password,
                    active: false,
                    mobileVerified: false,
                    token: registerData.tokens,
                    date: Date.now()
                })
                console.log('otp Sended successfully');
                resolve({ status: "success", message: "new account OTP verification needed" })

                  }).catch((err) => {
                    console.log("error happened ", err)
                })
                // OTP.verify
                //     .services(otpConfig.serviceID)
                //     .verifications
                //     .create({
                //         to: phonenumber,
                //         channel: "sms",
                //     })
                //     .then((data) => {
                //         console.log('otp Sended successfully');
                //         resolve({ status: "success", message: "new account OTP verification needed" })
                //     }).catch((err) => {
                //         console.log("error happened ", err)
                //     })
            }
        })
    },


    verifyotp: (otpData) => {

        console.log("otpData", otpData)
        return new Promise(async (resolve, reject) => {
            const user = await client.db(collections.DATABASE).collection(collections.USER_COLLECTION).findOne({ mobileNumber: otpData.mobileNumber })
            console.log("user", user);
            if (user) {

                if (user.otp == otpData.otp) {

                    await client.db(collections.DATABASE).collection(collections.USER_COLLECTION).findOneAndUpdate({ _id: user._id }, { $set: { active: true, mobileVerified: true, otp: null } }, { returnNewDocument: true }).then(async (response) => {
                        console.log("response", response)

                        if (response.ok) {
                            let userDetails = await client.db(collections.DATABASE).collection(collections.USER_COLLECTION).findOne({ _id: response.value._id })
                            console.log("userDetails", userDetails)
                            const token = await jwt.sign({ userId: userDetails._id }, config.secretKey, { expiresIn: '60d' });
                            resolve({ status: "success", message: "Account created. Please login.", userDetails: userDetails, token: token })
                        } else {

                            resolve({ status: "fail", message: "Something went wrong , Please try again later" })
                        }

                    }).catch((err) => {
                        resolve({ status: "fail", message: "Something went wrong , Please try again later" })
                    })


                } else {
                    console.log("OTP error");
                    resolve({ status: "fail", message: "Please enter the correct OTP" })
                }

            } else {

                resolve({ status: "fail", message: "Something went wrong , Please try again later" })
            }

            return;
            const otp = otpData.otp
            console.log(otp)

            let phonenumber = otpData.countryCode + otpData.mobileNumber
            await OTP
                .verify
                .services(otpConfig.serviceID)
                .verificationChecks
                .create({
                    to: phonenumber,
                    code: otp
                })
                .then(async (data) => {
                    console.log(data)
                    if (data.status == "approved") {
                        otpData.password = await bcrypt.hash(otpData.password, 10)
                        const signUp = await client.db(collections.DATABASE).collection(collections.USER_COLLECTION).insertOne({
                            username: otpData.username,
                            mobileNumber: otpData.mobileNumber,
                            posts: 0,
                            following: 0,
                            followers: 0,
                            password: otpData.password,
                            active: true,
                            mobileVerified: true,
                            date: Date.now()
                        })

                        if (signUp) {
                            const userDetails = await client.db(collections.DATABASE).collection(collections.USER_COLLECTION).findOne({ _id: signUp.insertedId })
                            if (userDetails) {
                                const token = jwt.sign({ userId: userDetails._id }, config.secretKey, { expiresIn: '60d' });
                                resolve({ status: "success", message: "Account created. Please login.", userDetails: userDetails, token: token })
                            } else {
                                resolve({ status: "fail", message: "Something went wrong , Please try again later" })
                            }
                        } else {
                            resolve({ status: "fail", message: "Something went wrong , Please try again later" })
                        }
                    } else {
                        console.log("OTP error");
                        resolve({ status: "fail", message: "Please enter the correct OTP" })
                    }
                }).catch((err) => {
                    resolve({ status: "fail", message: "Something went wrong , Please try again later" })
                })
        })
    },

    doLogin: (loginData) => {
        return new Promise(async (resolve, reject) => {
            const userExist = await client.db(collections.DATABASE).collection(collections.USER_COLLECTION).findOne({ mobileNumber: loginData.mobileNumber })
            if (!userExist) {
                resolve({ status: "fail", message: "There is no account found with this Mobile number" })
            } if (userExist) {
                bcrypt.compare(loginData.password, userExist.password).then(async (status) => {
                    if (status) {
                        await client.db(collections.DATABASE).collection(collections.USER_COLLECTION).findOneAndUpdate({ _id: userExist._id }, { $set: { token: loginData.tokens } }, { returnNewDocument: true })
                        console.log("login success in node server")
                        const token = jwt.sign({ userId: userExist._id }, config.secretKey, { expiresIn: '1h' });
                        resolve({ status: "success", message: "Login successfull", token: token, user: userExist })
                    } else {
                        resolve({ status: "fail", message: "Mobile No OR Password is incorrect" })
                    }
                }).catch((err) => {
                    resolve({ status: "fail", message: "Something went wrong please try again later" })
                })
            }
        })
    },

    getNotifications: (id) => {

        return new Promise(async (resolve, reject) => {
            
            const notific = await client.db(collections.DATABASE).collection(collections.NOTIFICATION_COLLECTION).find({ uid: new ObjectId(id) }).toArray()
            // const noti = await Deals.find()
            console.log(notific, "IIIIIIIIIIIIIIIIIIIIII")
            if (!notific) {
                resolve({ status: "fail", message: "No Notifications received" })
            } if (notific) {
                resolve({ status: "success", message: "Received Notifications !!!", notification: notific })
            }
        }).catch((err) => {
            resolve({ status: "fail", message: "Something went wrong please try again later" })
        })

    },

    requestOTP: (loginData) => {
        return new Promise(async (resolve, reject) => {
            const userExist = await client.db(collections.DATABASE).collection(collections.USER_COLLECTION).findOne({ mobileNumber: loginData.mobileNumber })
            if (!userExist) {
                resolve({ status: "fail", message: "There is no account found with this Mobile number" })
            } if (userExist) {
                let otp = await generateOTP()
                client.db(collections.DATABASE).collection(collections.USER_COLLECTION).updateOne({ _id: userExist._id }, { $set: { password_reset_otp: otp } }, { upsert: true })
                axios.get(`https://fast2sms.com/dev/bulkV2?authorization=9bvmsXet40fdDZgRSNMOIhTnaFPwl8cyELixQW7roUAj5p3CB2vCfQk34mgLjoSWDVUI0AtauOHicNM2&route=otp&variables_values=${otp}&flash=0&numbers=${loginData?.mobileNumber}`).then(async () => {
                    resolve({ status: "success", message: "otp sent" })
                }).catch((err) => {
                    resolve({ status: "fail", message: "Something went wrong please try again later" })
                })
            }
        })
    },

    resetPassword: (otpData) => {

        console.log("otpData", otpData)
        return new Promise(async (resolve, reject) => {


            const user = await client.db(collections.DATABASE).collection(collections.USER_COLLECTION).findOne({ mobileNumber: otpData.mobileNumber })

            console.log("user", user);

            if (user) {

                if (user.password_reset_otp == otpData.otp) {

                    const password = await bcrypt.hash(otpData.password, 10)

                    await client.db(collections.DATABASE).collection(collections.USER_COLLECTION).findOneAndUpdate({ _id: user._id }, { $set: { password: password, password_reset_otp: null } }, { returnNewDocument: true }).then(async (response) => {
                        console.log("response", response)

                        if (response.ok) {

                            resolve({ status: "success", message: "Password Reset Successfully" })
                        } else {

                            resolve({ status: "fail", message: "Something went wrong , Please try again later" })
                        }

                    }).catch((err) => {
                        resolve({ status: "fail", message: "Something went wrong , Please try again later" })
                    })


                } else {
                    console.log("OTP error");
                    resolve({ status: "fail", message: "Please enter the correct OTP" })
                }

            } else {

                resolve({ status: "fail", message: "Something went wrong , Please try again later" })
            }

            return;
            const otp = otpData.otp
            console.log(otp)

            let phonenumber = otpData.countryCode + otpData.mobileNumber
            await OTP
                .verify
                .services(otpConfig.serviceID)
                .verificationChecks
                .create({
                    to: phonenumber,
                    code: otp
                })
                .then(async (data) => {
                    console.log(data)
                    if (data.status == "approved") {
                        otpData.password = await bcrypt.hash(otpData.password, 10)
                        const signUp = await client.db(collections.DATABASE).collection(collections.USER_COLLECTION).insertOne({
                            username: otpData.username,
                            mobileNumber: otpData.mobileNumber,
                            posts: 0,
                            following: 0,
                            followers: 0,
                            password: otpData.password,
                            active: true,
                            mobileVerified: true,
                            date: Date.now()
                        })

                        if (signUp) {
                            const userDetails = await client.db(collections.DATABASE).collection(collections.USER_COLLECTION).findOne({ _id: signUp.insertedId })
                            if (userDetails) {
                                const token = jwt.sign({ userId: userDetails._id }, config.secretKey, { expiresIn: '60d' });
                                resolve({ status: "success", message: "Account created. Please login.", userDetails: userDetails, token: token })
                            } else {
                                resolve({ status: "fail", message: "Something went wrong , Please try again later" })
                            }
                        } else {
                            resolve({ status: "fail", message: "Something went wrong , Please try again later" })
                        }
                    } else {
                        console.log("OTP error");
                        resolve({ status: "fail", message: "Please enter the correct OTP" })
                    }
                }).catch((err) => {
                    resolve({ status: "fail", message: "Something went wrong , Please try again later" })
                })
        })
    },

    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const allUsers = await client.db(collections.DATABASE).collection(collections.USER_COLLECTION).find().toArray()
                if (allUsers) {
                    resolve(allUsers);
                } else {
                    resolve({ status: "fail", message: "Something went wrong." })
                }
            } catch (error) {
                resolve({ status: "fail", message: "Something went wrong." })
                console.log(error)
            }
        })
    },


    setOnline: (online) => {
        return new Promise(async (resolve, reject) => {
            try {
                if (online.userData) {
                    const obj = JSON.parse(online.userData);
                    const id = obj._id;
                    await client.db(collections.DATABASE).collection(collections.USER_COLLECTION).updateOne({ _id: new objectId(id) }, { $set: { onlineStatus: online.online } }, { upsert: true }).then((response) => {
                        // console.log(response);
                    })
                }

                resolve(online)
            } catch (error) {
                reject(error)
                console.log(error)
            }
        })
    }

}
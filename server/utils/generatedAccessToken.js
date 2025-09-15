import jwt from 'jsonwebtoken'

const generatedAccessToken = async(userId)=>{
    const token = await jwt.sign({ id : userId},
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn : process.env.ACCESS_TOKEN_EXPIRY}
    )

    return token
}

export default generatedAccessToken
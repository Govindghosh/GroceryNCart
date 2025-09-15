import UserModel from "../models/user.model.js"
import jwt from 'jsonwebtoken'

const genertedRefreshToken = async(userId)=>{
    const token = await jwt.sign({ id : userId},
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn : process.env.REFRESH_TOKEN_EXPIRY}
    )

    const updateRefreshTokenUser = await UserModel.updateOne(
        { _id : userId},
        {
            refresh_token : token
        }
    )

    return token
}

export default genertedRefreshToken
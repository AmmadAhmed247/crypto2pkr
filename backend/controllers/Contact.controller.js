import ContactSchema from "../models/ContactSchema.js";


export const getAllQueries=async(req , res)=>{
    try {
        const data=await ContactSchema.find();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({message:error.message});
    }
}


export const updateContactQueries=async(req , res)=>{
    try {
        const{name , email  , message}=req.body;
        if(!name || !email || !message){
            return res.json({message:"Please filled all the fields...."})
        }
        await ContactSchema.create({
            name:name , email:email , message:message
        });

        return res.status(200).json({success:true});
    } catch (error) {
        return res.json({message:error.message})
    }
}
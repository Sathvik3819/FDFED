import nodemailer from 'nodemailer';

function generateOTP(){
     return Math.floor(1000 + Math.random() * 9000).toString();
}
let otp1;

 async function OTP(email)  {
    
    const otp = await generateOTP();
    otp1=otp;

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: "sathvikchiluka@gmail.com",
            pass: "ehho qecv dlaz rtrr",
        },
    });

    let mes = {
        from: 'sathvikchiluka@gmail.com',
        to: email,
        subject: "OTP",
        text: `your otp is ${otp}`,
    }

    const info = await transporter.sendMail(mes, (err, info) => {
        if (err)
            console.log(err);
        else
            console.log(otp);
    });

    return otp;

}


function verify(email,otp){
    if(otp1===otp){
        return true;
    }else{
        return false;
    }
}


export {OTP,verify};


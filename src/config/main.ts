const Environment = "development"

const development = {
    OPENROUTER_API_KEY:"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",
    GOOGLE_CLIENT_ID: "282873812959-m6001dg9a1gh6co9nehcjtj4pj4u4pin.apps.googleusercontent.com", 
    GOOGLE_SECRET: "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",
    APP_URL:"http://localhost:5173",
    BETTER_AUTH_SECRET:"cIGLwaN4S6ojqCxrvuAjQ7IYQkN2JcVO01ilSrQR0gI=",
    BETTER_AUTH_URL:"http://localhost:5173",
    mongodburl: "mongodb+srv://Madni:MdMadni9@cluster0.0whvkqe.mongodb.net/?appName=Cluster0",
    mongodbname:"multi-gpt"
}

const production = {
    OPENROUTER_API_KEY:"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",
    GOOGLE_CLIENT_ID: "282873812959-m6001dg9a1gh6co9nehcjtj4pj4u4pin.apps.googleusercontent.com", 
    GOOGLE_SECRET: "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",
    APP_URL:"http://localhost:5173",
    BETTER_AUTH_URL:"http://localhost:5173",
    BETTER_AUTH_SECRET:"cIGLwaN4S6ojqCxrvuAjQ7IYQkN2JcVO01ilSrQR0gI=",
    mongodburl: "mongodb+srv://Madni:MdMadni9@cluster0.0whvkqe.mongodb.net/?appName=Cluster0",
    mongodbname:"multi-gpt"
}

const Config = {
    mongodburl: Environment === "development" ? development.mongodburl : production.mongodburl,
    GOOGLE_CLIENT_ID: Environment === "development" ? development.GOOGLE_CLIENT_ID : production.GOOGLE_CLIENT_ID,
    GOOGLE_SECRET: Environment === "development" ? development.GOOGLE_SECRET : production.GOOGLE_SECRET,
    mongodbname: Environment === "development" ? development.mongodbname : production.mongodbname,
    BETTER_AUTH_SECRET: Environment === "development" ? development.BETTER_AUTH_SECRET : production.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: Environment === "development" ? development.BETTER_AUTH_URL : production.BETTER_AUTH_URL,
    OPENROUTER_API_KEY: Environment === "development" ? development.OPENROUTER_API_KEY : production.OPENROUTER_API_KEY,
    APP_URL: Environment === "development" ? development.APP_URL : production.APP_URL,
}

export default Config
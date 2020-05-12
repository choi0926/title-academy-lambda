const { ApolloServer, gql } = require("apollo-server-lambda");
const db = require("./models");
const dotenv = require("dotenv");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const redis = require("redis");
const JWTR = require("jwt-redis").default;
const { context } = require("./middleware/auth");
const { sendMail } = require("./middleware/mailsender");

dotenv.config();
db.sequelize.sync();
const redisClient = redis.createClient(process.env.REDIS_URL);
const jwtr = new JWTR(redisClient);
const typeDefs = gql`
  scalar DATE

  type User {
    email: String!
    nickname: String!
    password: String!
    description: String
    profile: String
  }
  type LoginUser {
    user: User!
    accessToken: String!
    refreshToken: String!
  }

  type Post {
    category: String!
    subject: String!
    content: String!
    createdAt: DATE!
    updatedAt: DATE!
    recommend: Int!
    views: Int!
    UserId: Int!
  }

  type Comment {
    content: String!
    createdAt: DATE!
    updatedAt: DATE!
    UserId: Int!
    PostId: Int!
  }

  type Image {
    UserId: Int!
    src: String!
    createdAt: DATE!
    updatedAt: DATE!
  }
  type PostInfo {
    post: Post!
    image: Image!
    comment: Comment!
  }

  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }
  type Query {
    users: [User!]!
    user(email: String!): User
    forgotPassword(email: String!): String!
    authCode(authCode: String!): User!
    posts: [Post]!
    post(PostId: Int!): Post!
    comment(PostId: Int!): [Comment]!
    image(PostId: Int!): [Image]!
  }
  type Mutation {
    addUser(email: String!, nickname: String!, password: String!): User!
    login(email: String!, password: String!): LoginUser
    logout: String!
    tokenReissue(accessToken: String!, refreshToken: String!): String!
    userInfoModifed(email: String!, password: String!): String!
    addPost(
      category: String!
      subject: String!
      content: String!
      file: Upload
    ): String!
    addComment(PostId: Int!, content: String!): Comment!
  }
`;

const resolvers = {
  Query: {
    async users(parents, args) {
      const users = await db.User.findAll();
      return users;
    },
    async user(parents, { email }) {
      try {
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
          throw new Error("User not found.");
        }
        return user;
      } catch (err) {
        return err;
      }
    },
    async forgotPassword(parents, { email }) {
      try {
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
          throw new Error("User email does not exist.");
        }
        crypto.pbkdf2(
          user.email,
          process.env.AUTH_SECRET,
          100000,
          64,
          "sha512",
          async (err, key) => {
            const authCode = key.toString("base64");
            await db.User.update(
              { authCode },
              { where: { email: user.email } }
            );
            sendMail(user.email, "Your titleacademy password reset", authCode);
          }
        );
        return "Your mail has been sent successfully.";
      } catch (err) {
        return err;
      }
    },
    async authCode(parents, { authCode }) {
      try {
        const user = await db.User.findOne({ where: { authCode } });
        if (!user) {
          throw new Error("Authentication failed.");
        }
        return user;
      } catch (err) {
        return err;
      }
    },

    async posts(parents, args) {
      try {
        const getPost = await db.Post.findAll();
        return getPost;
      } catch (err) {
        return err;
      }
    },
    async post(parents, { PostId }) {
      try {
        const getPost = await db.Post.findOne({ where: { id: PostId } });
        if (!getPost) {
          throw new Error("This post does not exist.");
        }
        return getPost;
      } catch (err) {
        return err;
      }
    },
    async comment(parents, { PostId }) {
      try {
        const getComment = await db.Comment.findAll({ where: { PostId } });
        return getComment;
      } catch (err) {
        return err;
      }
    },
    async image(parents, { PostId }) {
      try {
        const getImage = await db.Image.findAll({ where: { PostId } });
        return getImage;
      } catch (err) {
        return err;
      }
    },
  },
  Mutation: {
    async addUser(parents, { email, nickname, password }) {
      try {
        const users = await db.User.findOne({ where: { email } });
        if (users) {
          throw new Error("That email has already been registered.");
        }
        const hashpass = await bcrypt.hash(password, 10);
        const addUser = await db.User.create({
          email,
          nickname,
          password: hashpass,
        });
        return addUser;
      } catch (err) {
        return err;
      }
    },

    async login(parents, { email, password }) {
      try {
        let users = await db.User.findOne({ where: { email } });
        if (!users) {
          throw new Error("Please check your email or password.");
        }
        const hashpass = await bcrypt.compare(password, users.password);
        if (!hashpass) {
          throw new Error("Please check your email or password.");
        }
        const payload = { email };
        const accessToken = await jwtr.sign(
          payload,
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "15m" }
        );
        const refreshToken = await jwtr.sign(
          payload,
          process.env.REFRESH_TOKEN_SECRET
        );
        await db.User.update({ refreshToken }, { where: { id: users.id } });
        return {
          user: users,
          accessToken,
          refreshToken,
        };
      } catch (err) {
        return err;
      }
    },
    async logout(parents, args, context) {
      try {
        await jwtr.destroy(
          context.AccessTokenVerifyJti,
          process.env.ACCESS_TOKEN_SECRET
        );
        const logoutUser = await db.User.findOne({
          where: { id: context.user.id },
        });
        const refreshTokenDecoded = await jwtr.verify(
          logoutUser.refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );
        if (!refreshTokenDecoded) {
          throw new Error("Invalid token");
        }
        await jwtr.destroy(
          refreshTokenDecoded.jti,
          process.env.REFRESH_TOKEN_SECRET
        );
        await db.User.update(
          { refreshToken: "" },
          { where: { id: logoutUser.id } }
        );
        return "Successful logout";
      } catch (err) {
        return err;
      }
    },
    async tokenReissue(parents, { accessToken, refreshToken }) {
      try {
        const accessTokenDecoded = await jwtr.decode(accessToken);
        const tokenReissueUser = await db.User.findOne({
          where: { email: accessTokenDecoded.email },
        });
        const meRefreshToken = tokenReissueUser.refreshToken;
        if (meRefreshToken !== refreshToken) {
          throw new Error("Invalid token");
        }
        const payload = { email: tokenReissueUser.email };
        const accessTokenReissue = await jwtr.sign(
          payload,
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "15m" }
        );
        return accessTokenReissue;
      } catch (err) {
        return err;
      }
    },
    async userInfoModifed(parents, { email, password }) {
      try {
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
          throw new Error("The user does not exist.");
        }
        const hashpass = await bcrypt.hash(password, 10);
        await db.User.update(
          { password: hashpass },
          { where: { email: user.email } }
        );
        return "Your password has been modified.";
      } catch (err) {
        return err;
      }
    },
    // async addPost(parents, { category, subject, content, image }, context) {
    async addPost(parents, { category, subject, content, file }, context) {
      try {
        const addPost = await db.Post.create({
          category,
          subject,
          content,
          UserId: context.user.id,
        });
        const { createReadStream, filename, mimetype } = await file;
        const fileStream = createReadStream();

        const Date = moment().format("YYYYMMDD");
        const randomString = Math.random().toString(36).substring(2, 7);
        const uploadParams = {
          Bucket: "title-academy",
          Key: `post/${Date}_${randomString}_${filename}`,
          Body: fileStream,
          ContentType: mimetype,
        };
        const result = await s3.upload(uploadParams).promise();
        console.log(result.Location);
        await db.Image.create({
          src: result.Location,
          UserId: context.user.id,
          PostId: addPost.id,
        });
        console.log(result);
        //TODO:
        // if (Array.isArray(image)) {
        //   const getImages = await Promise.all(
        //     image.map((image) => {
        //       return db.Image.create({ src: image, UserId: context.user.id, PostId: addPost.id });
        //     }),
        //   );
        //   await addPost.addImages(getImages);
        // }
        // const getImageInfo = await db.Image.findAll({ where: { PostId: addPost.id } });
        // const getComment = await db.Comment.findAll({ where: { PostId: addPost.id } });
        return "Successful post creation.";
      } catch (err) {
        return err;
      }
    },
    async addComment(parents, { PostId, content }, context) {
      try {
        const addComment = await db.Comment.create({
          content,
          UserId: context.user.id,
          PostId,
        });
        return addComment;
      } catch (err) {
        return err;
      }
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
  context,
});

exports.graphqlHandler = server.createHandler({});

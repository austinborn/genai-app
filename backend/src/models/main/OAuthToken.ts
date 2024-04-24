import { DataTypes } from "sequelize"
import { commonFields, CommonModel } from "../Common"
import { User } from "./User"
import { dbClient } from "../../dbClient"

export class OAuthToken extends CommonModel {
  public user_uuid!: string
  public provider!: string
  public access_token!: string
  public refresh_token!: string
  public expires_at!: number
  public scope!: string
  public token_type!: string
}

OAuthToken.init(
  {
    ...commonFields,
    provider: {
      type: DataTypes.STRING,
      allowNull: false      
    },
    access_token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    refresh_token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    scope: {
      type: DataTypes.STRING,
      allowNull: false
    },
    token_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    user_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: User, key: 'uuid' }
    },
  },
  {
    tableName: "oauth_token",
    sequelize: dbClient,
    timestamps: false,
    schema: 'main'
  }
)

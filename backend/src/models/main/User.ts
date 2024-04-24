import { DataTypes } from "sequelize"
import { commonFields, CommonModel } from "../Common"
import { dbClient } from "../../dbClient"

export class User extends CommonModel {
  public google_id?: string
  public discord_id?: string
  public default_nsfw_enabled!: boolean
  public subscription_tier!: string
  public email!: string
  public active!: boolean
}

User.init(
  {
    ...commonFields,
    google_id: {
      type: DataTypes.STRING,
      unique: true
    },
    discord_id: {
      type: DataTypes.STRING,
      unique: true
    },
    default_nsfw_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    subscription_tier: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    }
  },
  {
    tableName: "user",
    sequelize: dbClient,
    timestamps: false,
    schema: 'main'
  }
)

import { DataTypes } from "sequelize"
import { commonFields, CommonModel } from "../Common"
import { User } from "./../main/User"
import { dbClient } from "../../dbClient"

export class Note extends CommonModel {
  user_uuid!: string
  body?: string
}

Note.init(
  {
    ...commonFields,
    user_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: User, key: 'uuid' }
    },
    body: {
      type: DataTypes.STRING
    }
  },
  {
    tableName: "note",
    sequelize: dbClient,
    timestamps: false,
    schema: 'productivity'
  }
)

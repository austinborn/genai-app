import { DataTypes } from "sequelize"
import { commonFields, CommonModel } from "../Common"
import { dbClient } from "../../dbClient"

export class File extends CommonModel {
  public path!: string
  public type!: string
}

File.init(
  {
    ...commonFields,
    path: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    tableName: "file",
    sequelize: dbClient,
    timestamps: false,
    schema: 'main'
  }
)

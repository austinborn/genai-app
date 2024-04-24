import { DataTypes } from "sequelize"
import { commonFields, CommonModel } from "../Common"
import { User } from "./User"
import { dbClient } from "../../dbClient"

export class CompositeJob extends CommonModel {
  user_uuid!: string
  name!: string
}

CompositeJob.init(
  {
    ...commonFields,
    user_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: User, key: 'uuid' }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    composite_job: {
      type: DataTypes.JSONB
    }
  },
  {
    tableName: "composite_job",
    sequelize: dbClient,
    timestamps: false,
    schema: 'main'
  }
)

import { DataTypes } from "sequelize"
import { commonFields, CommonModel } from "../Common"
import { User } from "./User"
import { Job } from "./Job"
import { dbClient } from "../../dbClient"

export class Workflow extends CommonModel {
  user_uuid!: string
  latest_job_uuid?: string
}

Workflow.init(
  {
    ...commonFields,
    user_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: User, key: 'uuid' }
    },
    latest_job_uuid: {
      type: DataTypes.UUID,
      unique: true,
      references: { model: Job, key: 'uuid' }
    }
  },
  {
    tableName: "workflow",
    sequelize: dbClient,
    timestamps: false,
    schema: 'main'
  }
)

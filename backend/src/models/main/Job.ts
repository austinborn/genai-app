import { DataTypes } from "sequelize"
import { commonFields, CommonModel } from "../Common"
import { User } from "./User"
import { Workflow } from "./Workflow"
import { dbClient } from "../../dbClient"

export class Job extends CommonModel {
  workflow_uuid!: string
  previous_job_uuid?: string
  job_index!: string
}

Job.init(
  {
    ...commonFields,
    workflow_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Workflow, key: 'uuid' }
    },
    previous_job_uuid: {
      type: DataTypes.UUID,
      references: { model: User, key: 'uuid' }
    },
    job_index: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "job",
    sequelize: dbClient,
    timestamps: false,
    schema: 'main'
  }
)

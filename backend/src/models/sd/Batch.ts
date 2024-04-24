import { DataTypes } from "sequelize"
import { commonFields, CommonModel } from "../Common"
import { File } from "../main/File"
import { Job } from "../main/Job"
import { dbClient } from "../../dbClient"

export class Batch extends CommonModel {
  public prompt!: string
  public negative_prompt?: string
  public height?: string
  public width?: string
  public steps!: string
  public guidance!: string
  public eta!: string
  public allow_nsfw!: boolean
  public num_seeds!: string
  public init_image_uuid?: string
  public strength!: string
  public user_uuid!: string
  public job_uuid!: string
}

Batch.init(
  {
    ...commonFields,
    prompt: {
      type: DataTypes.STRING,
      allowNull: false
    },
    negative_prompt: {
      type: DataTypes.STRING      
    },
    height: {
      type: DataTypes.INTEGER
    },
    width: {
      type: DataTypes.INTEGER
    },
    steps: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    guidance: {
      type: DataTypes.NUMBER,
      allowNull: false
    },
    eta: {
      type: DataTypes.NUMBER,
      allowNull: false
    },
    allow_nsfw: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    num_seeds: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    init_image_uuid: {
      type: DataTypes.UUID,
      references: { model: File, key: 'uuid' }
    },
    strength: {
      type: DataTypes.NUMBER
    },
    job_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Job, key: 'uuid' }
    },
  },
  {
    tableName: "batch",
    sequelize: dbClient,
    timestamps: false,
    schema: 'sd'
  }
)

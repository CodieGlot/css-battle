import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserEntity1680666617275 implements MigrationInterface {
    name = 'CreateUserEntity1680666617275'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "subscription_transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "status" boolean NOT NULL DEFAULT true, "product_id" character varying NOT NULL, "verification_data" character varying NOT NULL, "exp_date" TIMESTAMP NOT NULL, "user_id" uuid, CONSTRAINT "PK_7b09f3deca1a0833c47555a119e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('USER', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "role" "public"."user_role_enum" NOT NULL DEFAULT 'USER', "email" character varying NOT NULL, "password" character varying, "register_type" character varying NOT NULL DEFAULT 'REGISTER', "is_subscription" boolean NOT NULL DEFAULT false, "last_login" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "geography_location" ("id" SERIAL NOT NULL, "timezone" character varying NOT NULL, "region" character varying NOT NULL, "city" character varying NOT NULL, "country" character varying NOT NULL, "latitude" character varying NOT NULL, "longitude" character varying NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "REL_5c00c09494c10758bd68e4d3fc" UNIQUE ("user_id"), CONSTRAINT "PK_1cffc0c642d87302f7c461e507e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "subscription_transaction" ADD CONSTRAINT "FK_ddd69943f74e56df3460691763a" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "geography_location" ADD CONSTRAINT "FK_5c00c09494c10758bd68e4d3fc9" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "geography_location" DROP CONSTRAINT "FK_5c00c09494c10758bd68e4d3fc9"`);
        await queryRunner.query(`ALTER TABLE "subscription_transaction" DROP CONSTRAINT "FK_ddd69943f74e56df3460691763a"`);
        await queryRunner.query(`DROP TABLE "geography_location"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "subscription_transaction"`);
    }

}

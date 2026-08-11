-- CreateTable
CREATE TABLE "raw_data" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "line" TEXT NOT NULL,
    "input_qty" INTEGER NOT NULL,
    "first_pass_good_qty" INTEGER NOT NULL,
    "defect_qty" INTEGER NOT NULL,
    "planned_minutes" DOUBLE PRECISION NOT NULL,
    "downtime_minutes" DOUBLE PRECISION NOT NULL,
    "target_ct_sec" DOUBLE PRECISION NOT NULL,
    "actual_ct_sec" DOUBLE PRECISION NOT NULL,
    "standard_setup_min" DOUBLE PRECISION NOT NULL,
    "actual_setup_min" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "raw_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" SERIAL NOT NULL,
    "eng_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "line" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "due_date" TEXT NOT NULL,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tools" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "planned_hours" DOUBLE PRECISION NOT NULL,
    "actual_available_hours" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "improvements" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "baseline" DOUBLE PRECISION NOT NULL,
    "after" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "improvements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defects" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "line" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "defect_type" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "defects_pkey" PRIMARY KEY ("id")
);


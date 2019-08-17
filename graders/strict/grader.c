#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    char* inPath = getenv("INPUT_PATH");
    char* ansPath = getenv("ANSWER_PATH");
    char* runCmd = getenv("RUN_CMD");

    FILE* inFile = fopen(inPath, "r");
    FILE* ansFile = fopen(ansPath, "r");

    if (inFile == NULL) {
        fprintf(stderr, "input file missing\n");
        return 1;
    }

    if (ansFile == NULL) {
        fprintf(stderr, "answer file missing\n");
        return 2;
    }

    char buf[1024];
    char buf2[1024];

    FILE* fp = popen(runCmd, "r+");
    while (fgets(buf, 1023, inFile) != NULL) {
        fprintf(fp, "%s", buf);
    }

    if (fp == NULL) {
        puts("RTE");
        return 0;
    }

    while (fgets(buf, sizeof(buf) - 1, fp) != NULL) {
        if (fgets(buf2, sizeof(buf2) - 1, ansFile) == NULL) {
            puts("WA");
            return 0;
        }

        buf[sizeof(buf) - 1] = '\0';
        buf2[sizeof(buf2) - 1] = '\0';

        if (strcmp(buf, buf2) != 0) {
            puts("WA");
            return 0;
        }
    }

    if (fgets(buf, sizeof(buf) - 1, ansFile) != NULL) {
        puts("WA");
        return 0;
    }

    puts("AC");

    fclose(inFile);
    fclose(ansFile);
    pclose(fp);

    return 0;
}